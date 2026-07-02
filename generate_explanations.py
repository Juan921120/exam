#!/usr/bin/env python3
"""
为 questions.json 中的每题自动生成解析说明（优化版）
策略：
1. 判断题：基于题目中的核心名词 + 答案（T/F）生成针对性解析
2. 单选题：提取正确答案文本，结合题目关键词生成解析
3. 多选题：提取所有正确选项文本，生成综合性解析
"""

import json
import re
from collections import Counter

# ── 核心名词→解析模板（自动从题目中提取，无需手动维护） ──
# 这些是兜底模板，当自动提取失败时使用
FALLBACK_TEMPLATES = {
    "T": "该说法正确，符合相关理论知识和实践规范。",
    "F": "该说法错误，与相关理论知识和实际操作规范不符。"
}

# ── 自动生成解析的核心函数 ──

def extract_core_noun(text):
    """
    从题目中提取核心名词/关键词
    例如："数据融合技术主要用于..." → "数据融合"
    """
    # 移除疑问词和修饰词
    stop_words = ["以下", "上述", "关于", "对于", "是指", "指的是", "通常", "一般", 
                  "主要", "可以", "能够", "需要", "应当", "应该", "必须", "一定"]
    
    # 提取第一个有意义的2-4字名词
    # 匹配中文词组
    pattern = r'([\u4e00-\u9fa5]{2,4})(?:技术|工具|方法|系统|平台|流程|原则|规范|标准|数据|模型|算法|训练|业务|流程)'
    match = re.search(pattern, text)
    if match:
        return match.group(1) + match.group(0)[-2:] if len(match.group(0)) >= 4 else match.group(1)
    
    # 备选：提取第一个2-4字中文词组
    pattern2 = r'([\u4e00-\u9fa5]{2,4})'
    matches = re.findall(pattern2, text)
    for m in matches:
        if m not in stop_words and len(m) >= 2:
            return m
    
    return None


def generate_tf_explanation(q):
    """生成判断题解析 - 自动提取核心词生成针对性解析"""
    text = q.get("q", "")
    answer = q.get("answer", "")
    
    # 1. 尝试提取核心名词
    core = extract_core_noun(text)
    
    # 2. 判断是否包含否定词（用于错误题的更精确描述）
    has_negation = any(word in text for word in ["不需要", "无需", "不用", "不能", "无法", "不应", "不可"])
    has_absolute = any(word in text for word in ["所有", "任何", "完全", "唯一", "只能", "只要", "必须"])
    
    # 3. 生成针对性解析
    if answer == "T":
        if core:
            return f"该说法正确。{core}的相关定义和操作规范与题目描述一致，符合行业标准。"
        elif "是" in text and "。" in text:
            # 提取句号前的部分作为依据
            prefix = text.split("。")[0] if "。" in text else text
            return f"该说法正确。{prefix}，这是该知识点的基本定义。"
        else:
            return FALLBACK_TEMPLATES["T"]
    else:
        if core:
            if has_absolute:
                return f"该说法错误。关于{core}的描述过于绝对，实际情况中存在多种可能性和例外，不可一概而论。"
            elif has_negation:
                return f"该说法错误。{core}在实践中确实需要考虑相关因素，题目中的否定表述不符合实际要求。"
            else:
                return f"该说法错误。{core}的实际规范与题目描述不符，需要根据正确的理论依据进行判断。"
        elif "可以" in text and "直接" in text:
            return "该说法错误。虽然操作可能可行，但通常需要遵循规范流程或满足前置条件，不能直接进行。"
        else:
            return FALLBACK_TEMPLATES["F"]


def generate_single_explanation(q):
    """生成单选题解析 - 提取正确答案并解释"""
    text = q.get("q", "")
    answer = q.get("answer", "")
    options = q.get("options", [])
    
    # 找到正确答案的文本
    correct_text = ""
    for opt in options:
        if opt.get("key") == answer:
            correct_text = opt.get("text", "")
            break
    
    # 提取核心名词
    core = extract_core_noun(text)
    
    # 生成解析
    if core and correct_text:
        return f'正确答案：{answer}。在{core}的相关知识中，{correct_text}是最符合题意的选项。'
    elif correct_text:
        return f'正确答案：{answer}。{correct_text}是该知识点的正确表述。'
    else:
        return f'正确答案：{answer}。请结合相关知识点理解该选项为何正确。'


def generate_multi_explanation(q):
    """生成多选题解析 - 综合所有正确选项"""
    text = q.get("q", "")
    answer = q.get("answer", "")
    options = q.get("options", [])
    
    # 收集正确选项的文本
    correct_texts = []
    for opt in options:
        if opt.get("key") in answer:
            correct_texts.append(opt.get("text", ""))
    
    # 提取核心名词
    core = extract_core_noun(text)
    
    # 生成解析
    if core and correct_texts:
        if len(correct_texts) == 1:
            return f'正确答案：{answer}。在{core}的知识体系中，{correct_texts[0]}是正确表述。'
        elif len(correct_texts) == 2:
            return f'正确答案：{answer}。{core}涵盖多个方面，{correct_texts[0]}和{correct_texts[1]}都是正确的表述。'
        else:
            return f'正确答案：{answer}。{core}涉及多个维度，{len(correct_texts)}个正确选项共同构成了完整的知识内容。'
    elif correct_texts:
        return f'正确答案：{answer}。正确选项包括：{"；".join(correct_texts)}。'
    else:
        return f'正确答案：{answer}。请结合相关知识点理解各正确选项。'


def generate_explanation(q):
    """根据题目类型生成解析"""
    q_type = q.get("type", "")
    
    if q_type == "tf":
        return generate_tf_explanation(q)
    elif q_type == "single":
        return generate_single_explanation(q)
    elif q_type == "multi":
        return generate_multi_explanation(q)
    else:
        return "请参考相关知识点理解本题。"


def analyze_coverage(questions):
    """分析解析生成质量"""
    generic_count = 0
    tf_count = 0
    single_count = 0
    multi_count = 0
    
    for q in questions:
        expl = q.get("explanation", "")
        if expl in FALLBACK_TEMPLATES.values() or "相关知识点" in expl:
            generic_count += 1
        
        if q["type"] == "tf":
            tf_count += 1
        elif q["type"] == "single":
            single_count += 1
        elif q["type"] == "multi":
            multi_count += 1
    
    return {
        "total": len(questions),
        "tf": tf_count,
        "single": single_count,
        "multi": multi_count,
        "generic": generic_count
    }


def main():
    # 读取原始题库
    with open("questions.json", "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    print(f"📚 共加载 {len(questions)} 题")
    print("🔄 正在生成解析...")
    
    for q in questions:
        q["explanation"] = generate_explanation(q)
    
    # 分析覆盖情况
    stats = analyze_coverage(questions)
    print(f"\n📊 统计信息:")
    print(f"   - 判断题: {stats['tf']} 题")
    print(f"   - 单选题: {stats['single']} 题")
    print(f"   - 多选题: {stats['multi']} 题")
    
    generic_rate = stats['generic'] / stats['total'] * 100 if stats['total'] > 0 else 0
    print(f"   - 通用解析(待优化): {stats['generic']} 题 ({generic_rate:.1f}%)")
    
    if generic_rate > 20:
        print(f"\n⚠️  建议: 有 {stats['generic']} 题使用了通用模板，可考虑人工复核优化。")
    
    # 写回文件
    with open("questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    print("\n✅ questions.json 已更新！")


if __name__ == "__main__":
    main()