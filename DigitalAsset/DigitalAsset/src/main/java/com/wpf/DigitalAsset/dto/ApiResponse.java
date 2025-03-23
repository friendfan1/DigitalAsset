package com.wpf.DigitalAsset.dto;

/**
 * API响应数据传输对象
 */
public class ApiResponse {
    
    /**
     * 操作是否成功
     */
    private boolean success;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 响应数据
     */
    private Object data;
    
    /**
     * 默认构造函数
     */
    public ApiResponse() {
    }
    
    /**
     * 带参数构造函数
     * @param success 是否成功
     * @param message 消息
     * @param data 数据
     */
    public ApiResponse(boolean success, String message, Object data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
    
    /**
     * 获取是否成功
     * @return 是否成功
     */
    public boolean isSuccess() {
        return success;
    }
    
    /**
     * 设置是否成功
     * @param success 是否成功
     */
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    /**
     * 获取消息
     * @return 消息
     */
    public String getMessage() {
        return message;
    }
    
    /**
     * 设置消息
     * @param message 消息
     */
    public void setMessage(String message) {
        this.message = message;
    }
    
    /**
     * 获取数据
     * @return 数据
     */
    public Object getData() {
        return data;
    }
    
    /**
     * 设置数据
     * @param data 数据
     */
    public void setData(Object data) {
        this.data = data;
    }
} 