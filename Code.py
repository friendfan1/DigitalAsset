import os
from collections import defaultdict
from prettytable import PrettyTable

# 配置支持的编程语言及其注释符号
LANGUAGE_CONFIG = {
    'python': {
        'extensions': ['.py'],
        'single_line': ['#'],
        'multi_line': None
    },
    'javascript': {
        'extensions': ['.js'],
        'single_line': ['//'],
        'multi_line': ('/*', '*/')
    },
    'typescript': {
        'extensions': ['.ts', '.tsx'],
        'single_line': ['//'],
        'multi_line': ('/*', '*/')
    },
    'java': {
        'extensions': ['.java'],
        'single_line': ['//'],
        'multi_line': ('/*', '*/')
    },
    'c/c++': {
        'extensions': ['.c', '.h', '.cpp', '.hpp', '.cc'],
        'single_line': ['//'],
        'multi_line': ('/*', '*/')
    },
    'solidity': {
        'extensions': ['.sol'],
        'single_line': ['//'],
        'multi_line': ('/*', '*/')
    },
    'vue': {
        'extensions': ['.vue'],
        'single_line': ['//'],
        'multi_line': ('/*', '*/'),
        'template_tags': ('<template>', '</template>'),
        'script_tags': ('<script>', '</script>'),
        'style_tags': ('<style>', '</style>')
    }
}


def get_files(directory, exclude_dirs):
    """遍历目录获取文件列表"""
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            yield os.path.join(root, file)

def detect_language(file_path):
    """根据文件扩展名检测编程语言"""
    ext = os.path.splitext(file_path)[1].lower()
    for lang, config in LANGUAGE_CONFIG.items():
        if ext in config['extensions']:
            return lang
    return None

def analyze_file(file_path):
    """分析单个文件的代码统计"""
    lang = detect_language(file_path)
    if not lang:
        return None

    config = LANGUAGE_CONFIG[lang]
    single_line = config['single_line']
    multi_line = config['multi_line']

    stats = {
        'total': 0,
        'empty': 0,
        'comment': 0,
        'code': 0
    }

    in_block_comment = False
    in_template = in_script = in_style = False

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except:
        return None

    for line in lines:
        stats['total'] += 1
        stripped = line.strip()

        # 处理 Vue 文件的模板、脚本和样式部分
        if lang == 'vue':
            if stripped.startswith(config['template_tags'][0]):
                in_template = True
                continue
            elif stripped.startswith(config['template_tags'][1]):
                in_template = False
                continue
            elif stripped.startswith(config['script_tags'][0]):
                in_script = True
                continue
            elif stripped.startswith(config['script_tags'][1]):
                in_script = False
                continue
            elif stripped.startswith(config['style_tags'][0]):
                in_style = True
                continue
            elif stripped.startswith(config['style_tags'][1]):
                in_style = False
                continue

        # 处理多行注释
        if in_block_comment:
            stats['comment'] += 1
            if multi_line and multi_line[1] in line:
                in_block_comment = False
            continue

        if multi_line and stripped.startswith(multi_line[0]):
            stats['comment'] += 1
            in_block_comment = True
            if multi_line[1] in line:
                in_block_comment = False
            continue

        # 处理单行注释
        is_comment = False
        for symbol in single_line:
            if stripped.startswith(symbol):
                stats['comment'] += 1
                is_comment = True
                break
        if is_comment:
            continue

        # 处理空行
        if not stripped:
            stats['empty'] += 1
        else:
            stats['code'] += 1

    return (lang, stats)

def main():
    """主函数"""
    directory = input("请输入要统计的目录路径：")
    exclude_dirs = {'venv', '.git', '__pycache__', 'node_modules'}

    statistics = defaultdict(lambda: {
        'files': 0,
        'total': 0,
        'empty': 0,
        'comment': 0,
        'code': 0
    })

    for file_path in get_files(directory, exclude_dirs):
        result = analyze_file(file_path)
        if result:
            lang, stats = result
            statistics[lang]['files'] += 1
            statistics[lang]['total'] += stats['total']
            statistics[lang]['empty'] += stats['empty']
            statistics[lang]['comment'] += stats['comment']
            statistics[lang]['code'] += stats['code']

    # 创建并打印表格
    table = PrettyTable()
    table.field_names = ["Language", "Files", "Total", "Empty", "Comment", "Code"]
    
    total_files = total_lines = total_empty = total_comment = total_code = 0
    
    for lang, stats in statistics.items():
        table.add_row([
            lang.capitalize(),
            stats['files'],
            stats['total'],
            stats['empty'],
            stats['comment'],
            stats['code']
        ])
        total_files += stats['files']
        total_lines += stats['total']
        total_empty += stats['empty']
        total_comment += stats['comment']
        total_code += stats['code']

    # 添加总计行
    table.add_row([
        "TOTAL",
        total_files,
        total_lines,
        total_empty,
        total_comment,
        total_code
    ])

    print("\n代码统计结果：")
    print(table)

if __name__ == "__main__":
    main()