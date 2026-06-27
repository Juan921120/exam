#!/usr/bin/env python3
"""
为 questions.json 中的每题自动生成解析说明（本地数据）。
解析基于题目类型、关键词和答案生成。
"""

import json
import re

# ── 判断题解析模板 ──
TF_TRUE_EXPLANATIONS = {
    "道德": "该行为符合职业道德规范的要求，是职业活动中应当遵循的基本准则。",
    "语音": "语音输入是Windows系统提供的智能应用功能之一，可通过语音识别技术实现文字输入。",
    "维护": "Windows系统维护工具确实可以帮助用户优化系统性能、清理垃圾文件和修复问题。",
    "Ctrl": "这是Windows系统中的标准快捷键操作，可用于复制选中的文本或对象。",
    "Word": "Word作为办公软件，具备多文档编辑、样式应用、图文混排等功能。",
    "浏览器": "浏览器是访问网页的基本工具，通过地址栏输入网址即可访问目标网站。",
    "人工智能": "该描述符合人工智能训练师的职业规范，应当充分考虑技术发展趋势和潜在风险。",
    "趋势": "随着人工智能技术的发展，该描述反映了行业内的正确认知和实践方向。",
}

TF_FALSE_EXPLANATIONS = {
    "敏感数据": "根据数据保护法规和职业道德，处理敏感数据必须获得用户明确同意，不可擅自使用。",
    "全球化": "职业道德在不同国家和地区存在差异，受文化、法律和社会环境的影响，并非单一化。",
    "训练效果": "人工智能训练师在职业道德建设中必须综合考虑数据质量、适用性等多方面因素，而非仅关注训练效果。",
    "歧视": "人工智能训练师对模型输出结果负有责任，必须关注和避免模型可能产生的歧视性或偏见性结果。",
    "隐私": "保护用户隐私是人工智能训练师职业道德的重要组成部分，必须在工作中严格遵守。",
    "算法": "人工智能训练师的主要任务包括数据标注、模型训练、效果评估等，而不仅仅是设计和开发新算法。",
    "职业守则": "职业守则不仅是道德层面的约束，其中部分内容也可能涉及行业规范和法律责任。",
    "遵守法律": "遵守法律是职业守则的核心内容之一，是从业人员必须遵循的基本准则。",
    "自觉性": "职业守则的实施与监督需要组织制度保障和多方参与，不能完全依靠个人自觉性。",
    "个人利益": "奉献社会要求正确处理个人利益和社会整体利益的关系，应将社会整体利益放在首位，而非个人利益。",
    "爱岗敬业": "爱岗敬业是一种职业态度，更多取决于职业道德修养，而非仅取决于专业技能。",
    "模型参数": "调整模型参数需要基于科学方法和数据分析，不能仅凭个人经验和直觉，需要遵循规范流程。",
    "F8": "进入Windows高级启动选项通常需要按F8键，但在某些情况下鼠标和键盘无法使用时，可能需要其他方式。",
    "时钟": "Windows 10小工具中的时钟功能不支持锁定前端显示，这是该功能的限制。",
    "普遍性": "职业守则虽然有一定的通用性，但不同行业有其特定的职业守则要求，并非完全适用于所有行业。",
}

# ── 单选题解析模板 ──
SINGLE_EXPLANATIONS = {
    "职业道德": {
        "A": "职业道德是人们在职业活动中应遵循的行为准则和规范。",
        "B": "职业纪律是调整职业个人、职业主体和社会成员之间关系的行为准则和规范。",
        "C": "职业道德的基本要求包括爱岗敬业、诚实守信、办事公道、服务群众、奉献社会。",
        "D": "职业道德的核心是为人民服务。",
    },
    "Windows": {
        "A": "这是Windows操作系统的标准功能或操作方式。",
        "B": "Windows系统提供了多种方式进行文件管理和系统设置。",
        "C": "Windows操作系统的快捷键和功能设计符合用户操作习惯。",
        "D": "这是Windows系统中正确的操作步骤或功能描述。",
    },
    "Word": {
        "A": "Word作为办公软件，该功能是其标准特性之一。",
        "B": "Word提供了丰富的文档编辑和排版功能。",
        "C": "Word中的样式和模板功能可以大大提高办公效率。",
        "D": "Word支持多种格式的文档编辑和排版操作。",
    },
    "浏览器": {
        "A": "浏览器是访问互联网的基本工具，该功能是其标准特性。",
        "B": "浏览器提供了丰富的网页浏览和设置功能。",
        "C": "浏览器的设置和功能可以帮助用户更好地使用互联网。",
        "D": "这是浏览器中的正确操作方式或功能描述。",
    },
    "人工智能": {
        "A": "该选项正确描述了人工智能训练中的相关概念或流程。",
        "B": "人工智能训练涉及数据处理、模型训练、算法优化等多个环节。",
        "C": "该选项反映了人工智能领域的正确实践方法。",
        "D": "这是人工智能训练师工作中需要掌握的基本知识。",
    },
    "数据": {
        "A": "数据处理是人工智能训练中的重要环节，该选项描述了正确的处理方法。",
        "B": "数据标注需要遵循一定的规范和标准。",
        "C": "数据质量直接影响模型训练的效果。",
        "D": "该选项正确描述了数据相关的概念或操作。",
    },
}

# ── 多选题解析模板 ──
MULTI_EXPLANATIONS = {
    "职业道德": "职业道德是人们在职业活动中应遵循的行为准则和规范的总和，包括道德准则、道德情操和道德品质等方面。",
    "奉献社会": "奉献社会要求树立正确的义利观，正确处理个人利益与社会利益的关系，积极为社会做贡献。",
    "人工智能": "人工智能训练涉及多个方面的知识和技能，正确答案涵盖了该领域的关键要素。",
    "训练": "模型训练过程涉及多个环节和要素，正确答案包含了训练过程中的关键步骤。",
    "数据": "数据处理涉及多个环节，正确答案涵盖了数据处理的关键方面。",
    "Windows": "Windows系统提供了多种功能和工具，正确答案涵盖了相关功能的关键方面。",
    "Word": "Word提供了丰富的文档处理功能，正确答案涵盖了相关功能的关键特性。",
}


def generate_tf_explanation(q):
    """为判断题生成解析"""
    text = q.get("q", "")
    answer = q.get("answer", "")

    # 关键词匹配 - 错误题
    for keyword, explanation in TF_FALSE_EXPLANATIONS.items():
        if keyword in text and answer == "F":
            return explanation

    # 关键词匹配 - 正确题
    for keyword, explanation in TF_TRUE_EXPLANATIONS.items():
        if keyword in text and answer == "T":
            return explanation

    # 通用解析
    if answer == "T":
        # 分析题目内容生成合理的正确解析
        if "正确" in text or "可以" in text or "能够" in text or "是" in text:
            return "该说法正确，符合相关知识点和实际操作规范。"
        return "该说法正确，符合相关理论知识和实践要求。"
    else:
        # 分析题目内容生成合理的错误解析
        if "可以" in text or "能够" in text:
            return "该说法不正确，实际操作中存在限制条件或规范要求，并非所有情况都适用。"
        if "不需要" in text or "无需" in text or "不用" in text:
            return "该说法错误，相关环节确实需要考虑该因素，不可忽视。"
        if "完全" in text or "只能" in text or "唯一" in text:
            return "该说法过于绝对，实际情况更为复杂，存在多种可能性和影响因素。"
        if "所有" in text or "任何" in text:
            return "该说法以偏概全，并非所有情况都如此，存在例外情况。"
        return "该说法错误，不符合相关理论知识和实际操作规范。"


def generate_single_explanation(q):
    """为单选题生成解析"""
    text = q.get("q", "")
    answer = q.get("answer", "")
    options = q.get("options", [])

    # 找到正确答案的文本
    correct_text = ""
    for opt in options:
        if opt.get("key") == answer:
            correct_text = opt.get("text", "")
            break

    # 关键词匹配
    for keyword, explanations in SINGLE_EXPLANATIONS.items():
        if keyword in text and answer in explanations:
            return explanations[answer]

    # 通用解析
    if correct_text:
        return f'正确答案是"{answer}. {correct_text}"。根据题目所涉及的知识点，该选项最符合题意。'
    return f"正确答案是 {answer}。请根据相关知识点理解该选项为何正确。"


def generate_multi_explanation(q):
    """为多选题生成解析"""
    text = q.get("q", "")
    answer = q.get("answer", "")  # e.g., "ABC"
    options = q.get("options", [])

    # 收集正确选项的文本
    correct_texts = []
    for opt in options:
        if opt.get("key") in answer:
            correct_texts.append(f'{opt.get("key")}. {opt.get("text")}')

    # 关键词匹配
    for keyword, explanation in MULTI_EXPLANATIONS.items():
        if keyword in text:
            return explanation + f' 正确答案为 {answer}：{"；".join(correct_texts)}。'

    # 通用解析
    if correct_texts:
        return f'正确答案为 {answer}，包括：{"；".join(correct_texts)}。这些选项共同构成了该知识点的完整答案。'
    return f"正确答案为 {answer}。请结合相关知识点，理解每个正确选项的含义。"


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


def main():
    # 读取原始题库
    with open("questions.json", "r", encoding="utf-8") as f:
        questions = json.load(f)

    print(f"共 {len(questions)} 题")

    tf_count = 0
    single_count = 0
    multi_count = 0

    for q in questions:
        explanation = generate_explanation(q)
        q["explanation"] = explanation

        if q["type"] == "tf":
            tf_count += 1
        elif q["type"] == "single":
            single_count += 1
        elif q["type"] == "multi":
            multi_count += 1

    print(f"判断题: {tf_count}, 单选题: {single_count}, 多选题: {multi_count}")
    print("解析生成完成！")

    # 写回文件
    with open("questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print("questions.json 已更新。")


if __name__ == "__main__":
    main()