package com.wpf.DigitalAsset.controller;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * 分片文件控制器
 * 用于处理大文件的分片流式传输和下载
 */
@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChunkedFileController {

    private static final Logger logger = LoggerFactory.getLogger(ChunkedFileController.class);

    @Value("${ipfs.gateway}")
    private String ipfsGateway;

    @Value("${temp.dir:./temp}")
    private String tempDirPath;

    /**
     * 流式传输分片文件
     * 支持视频、音频等媒体文件的范围请求，实现在线播放功能
     */
    @GetMapping("/stream/{cid}")
    public ResponseEntity<InputStreamResource> streamChunkedFile(
            @PathVariable String cid,
            @RequestParam(required = false, defaultValue = "application/octet-stream") String type,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {
        
        try {
            // 检查CID参数
            if (cid == null || cid.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            // 获取分片索引文件URL
            String chunksIndexUrl = ipfsGateway + cid + "/chunks-index.json";
            logger.info("获取分片索引: {}", chunksIndexUrl);

            // 获取分片索引
            URL indexUrl = new URL(chunksIndexUrl);
            HttpURLConnection indexConn = (HttpURLConnection) indexUrl.openConnection();
            indexConn.setRequestMethod("GET");
            
            if (indexConn.getResponseCode() != 200) {
                logger.error("获取分片索引失败: {}", indexConn.getResponseCode());
                return ResponseEntity.status(indexConn.getResponseCode()).build();
            }
            
            // 解析分片索引JSON
            BufferedReader indexReader = new BufferedReader(new InputStreamReader(indexConn.getInputStream()));
            StringBuilder indexJson = new StringBuilder();
            String line;
            while ((line = indexReader.readLine()) != null) {
                indexJson.append(line);
            }
            indexReader.close();
            
            // 创建临时目录
            Path tempDir = Files.createDirectories(Paths.get(tempDirPath));
            Path tempFile = tempDir.resolve(UUID.randomUUID().toString());
            
            // 获取分片并合并
            JSONObject chunksIndex = new JSONObject(indexJson.toString());
            long totalSize = chunksIndex.getLong("totalSize");
            JSONArray chunks = chunksIndex.getJSONArray("chunks");
            
            // 如果有范围请求头
            if (rangeHeader != null && !rangeHeader.isEmpty()) {
                // 解析范围
                String[] ranges = rangeHeader.replace("bytes=", "").split("-");
                long start = Long.parseLong(ranges[0]);
                long end = ranges.length > 1 && !ranges[1].isEmpty() 
                        ? Long.parseLong(ranges[1]) 
                        : totalSize - 1;
                
                // 限制范围大小
                long maxRange = 10 * 1024 * 1024; // 10MB
                if (end - start > maxRange) {
                    end = start + maxRange - 1;
                }
                
                long rangeLength = end - start + 1;
                
                // 创建临时文件
                RandomAccessFile raf = new RandomAccessFile(tempFile.toFile(), "rw");
                
                // 计算需要下载哪些分片
                long offset = 0;
                for (int i = 0; i < chunks.length(); i++) {
                    JSONObject chunk = chunks.getJSONObject(i);
                    long chunkSize = chunk.getLong("size");
                    long chunkStart = offset;
                    long chunkEnd = offset + chunkSize - 1;
                    
                    // 如果分片和请求范围有交集
                    if (chunkEnd >= start && chunkStart <= end) {
                        // 下载分片
                        String chunkHash = chunk.getString("cid");
                        String chunkUrl = ipfsGateway + chunkHash;
                        byte[] chunkData = downloadChunk(chunkUrl);
                        
                        // 计算写入位置和长度
                        long writeStart = Math.max(0, start - chunkStart);
                        long writeEnd = Math.min(chunkSize - 1, end - chunkStart);
                        long writeLength = writeEnd - writeStart + 1;
                        
                        // 写入临时文件
                        raf.seek(Math.max(0, chunkStart - start));
                        raf.write(chunkData, (int)writeStart, (int)writeLength);
                    }
                    
                    offset += chunkSize;
                    
                    if (offset > end) {
                        break;
                    }
                }
                
                raf.close();
                
                // 创建响应
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType(type));
                headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline");
                headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
                headers.set(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + totalSize);
                headers.setContentLength(rangeLength);
                
                InputStreamResource resource = new InputStreamResource(new FileInputStream(tempFile.toFile()));
                
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .headers(headers)
                        .body(resource);
            } else {
                // 非范围请求 - 下载整个文件
                try (FileOutputStream output = new FileOutputStream(tempFile.toFile())) {
                    for (int i = 0; i < chunks.length(); i++) {
                        JSONObject chunk = chunks.getJSONObject(i);
                        String chunkHash = chunk.getString("cid");
                        String chunkUrl = ipfsGateway + chunkHash;
                        
                        byte[] chunkData = downloadChunk(chunkUrl);
                        output.write(chunkData);
                    }
                }
                
                // 创建响应
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType(type));
                headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline");
                headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
                headers.setContentLength(totalSize);
                
                InputStreamResource resource = new InputStreamResource(new FileInputStream(tempFile.toFile()));
                
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(resource);
            }
        } catch (Exception e) {
            logger.error("流式处理分片文件失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 下载分片文件
     * 合并所有分片并作为单个文件提供给用户下载
     */
    @GetMapping("/download/{cid}")
    public ResponseEntity<InputStreamResource> downloadChunkedFile(
            @PathVariable String cid,
            @RequestParam(required = false, defaultValue = "file") String filename) {
            
        try {
            // 检查CID参数
            if (cid == null || cid.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // 获取分片索引文件和元数据
            String chunksIndexUrl = ipfsGateway + cid + "/chunks-index.json";
            String metadataUrlStr = ipfsGateway + cid + "/metadata.json";
            
            logger.info("获取分片索引: {}", chunksIndexUrl);
            logger.info("获取元数据: {}", metadataUrlStr);
            
            // 获取分片索引
            URL indexUrl = new URL(chunksIndexUrl);
            HttpURLConnection indexConn = (HttpURLConnection) indexUrl.openConnection();
            indexConn.setRequestMethod("GET");
            
            if (indexConn.getResponseCode() != 200) {
                logger.error("获取分片索引失败: {}", indexConn.getResponseCode());
                return ResponseEntity.status(indexConn.getResponseCode()).build();
            }
            
            // 解析分片索引JSON
            BufferedReader indexReader = new BufferedReader(new InputStreamReader(indexConn.getInputStream()));
            StringBuilder indexJson = new StringBuilder();
            String line;
            while ((line = indexReader.readLine()) != null) {
                indexJson.append(line);
            }
            indexReader.close();
            
            // 获取元数据
            URL metadataUrl = new URL(metadataUrlStr);
            HttpURLConnection metadataConn = (HttpURLConnection) metadataUrl.openConnection();
            metadataConn.setRequestMethod("GET");
            
            String metadataJson = "";
            String contentType = "application/octet-stream";
            String actualFilename = filename;
            
            if (metadataConn.getResponseCode() == 200) {
                BufferedReader metadataReader = new BufferedReader(new InputStreamReader(metadataConn.getInputStream()));
                StringBuilder metadataBuilder = new StringBuilder();
                while ((line = metadataReader.readLine()) != null) {
                    metadataBuilder.append(line);
                }
                metadataReader.close();
                metadataJson = metadataBuilder.toString();
                
                // 解析元数据
                JSONObject metadata = new JSONObject(metadataJson);
                if (metadata.has("fileType")) {
                    contentType = metadata.getString("fileType");
                }
                if (metadata.has("fileName")) {
                    actualFilename = metadata.getString("fileName");
                }
            }
            
            // 创建临时目录
            Path tempDir = Files.createDirectories(Paths.get(tempDirPath));
            Path tempFile = tempDir.resolve(UUID.randomUUID().toString());
            
            // 获取分片并合并
            JSONObject chunksIndex = new JSONObject(indexJson.toString());
            long totalSize = chunksIndex.getLong("totalSize");
            JSONArray chunks = chunksIndex.getJSONArray("chunks");
            
            // 使用并行下载提高速度
            int threadCount = Math.min(Runtime.getRuntime().availableProcessors(), chunks.length());
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            
            List<byte[]> chunkDataList = new ArrayList<>(chunks.length());
            for (int i = 0; i < chunks.length(); i++) {
                chunkDataList.add(null); // 预分配位置
            }
            
            // 提交所有下载任务
            for (int i = 0; i < chunks.length(); i++) {
                final int index = i;
                executor.submit(() -> {
                    try {
                        JSONObject chunk = chunks.getJSONObject(index);
                        String chunkHash = chunk.getString("cid");
                        String chunkUrl = ipfsGateway + chunkHash;
                        
                        byte[] chunkData = downloadChunk(chunkUrl);
                        chunkDataList.set(index, chunkData);
                    } catch (Exception e) {
                        logger.error("下载分片失败 [{}]", index, e);
                    }
                });
            }
            
            // 等待所有下载完成
            executor.shutdown();
            executor.awaitTermination(30, TimeUnit.MINUTES);
            
            // 组合所有分片到输出文件
            try (FileOutputStream output = new FileOutputStream(tempFile.toFile())) {
                for (byte[] chunkData : chunkDataList) {
                    if (chunkData != null) {
                        output.write(chunkData);
                    }
                }
            }
            
            // 创建响应
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + actualFilename + "\"");
            headers.setContentLength(tempFile.toFile().length());
            
            InputStreamResource resource = new InputStreamResource(new FileInputStream(tempFile.toFile()));
            
            // 返回临时文件，设置删除标志
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("下载分片文件失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 下载单个分片内容
     */
    private byte[] downloadChunk(String url) throws IOException {
        URL chunkUrl = new URL(url);
        HttpURLConnection conn = (HttpURLConnection) chunkUrl.openConnection();
        conn.setRequestMethod("GET");
        
        if (conn.getResponseCode() != 200) {
            throw new IOException("下载分片失败: " + conn.getResponseCode());
        }
        
        try (InputStream in = conn.getInputStream();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
            return out.toByteArray();
        }
    }
    
    /**
     * 检查临时文件并清理过期文件
     */
    @Scheduled(fixedRate = 3600000) // 每小时运行一次
    public void cleanupTempFiles() {
        try {
            Path tempDir = Paths.get(tempDirPath);
            if (Files.exists(tempDir)) {
                Files.list(tempDir)
                    .filter(path -> Files.isRegularFile(path))
                    .forEach(path -> {
                        try {
                            // 获取文件的最后修改时间
                            long lastModified = Files.getLastModifiedTime(path).toMillis();
                            long now = System.currentTimeMillis();
                            
                            // 如果文件超过30分钟未修改，删除它
                            if (now - lastModified > 30 * 60 * 1000) {
                                Files.delete(path);
                                logger.info("已删除过期临时文件: {}", path);
                            }
                        } catch (IOException e) {
                            logger.error("清理临时文件失败", e);
                        }
                    });
            }
        } catch (Exception e) {
            logger.error("清理临时文件失败", e);
        }
    }
} 