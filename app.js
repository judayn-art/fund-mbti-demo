// ==================== 全局变量 ====================

// 当前步骤（1-4）
let currentStep = 1;

// 用户基本信息
let userInfo = {
    nickname: '',
    mbti: ''
};

// 用户财务画像信息
let userFinancialProfile = {
    ageRange: '',
    jobType: '',
    incomeRange: '',
    lumpSumBudget: '',
    monthlyContribution: '',
    mainGoal: '',
    horizon: '',
    liquidityNeed: ''
};

// MBTI 测评结果状态
let resultState = {
    answers: null,
    rawScores: null,
    profile: null,
    archetypeId: null,
    archetype: null,
    finalProfile: null,
    finalArchetypeId: null,
    finalArchetype: null
};

// ==================== DOM 元素变量声明 ====================

// 声明变量（在 DOMContentLoaded 中初始化）
let steps;
let progressFill;
let currentStepSpan;
let errorMessage;
let prevBtn;
let nextBtn;
let nicknameInput;
let mbtiSelect;
let seeSampleBtn;
let resultNickname;
let resultMbti;
let restartBtn;
let btnGoProfile;
let btnSkipProfile;
let quizQuestions;
let finalResult;

// ==================== 初始化 ====================

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // ========== 初始化 DOM 元素 ==========
    steps = {
        1: document.getElementById('step1'),
        2: document.getElementById('step2'),
        3: document.getElementById('step3'),
        4: document.getElementById('step4')
    };
    progressFill = document.getElementById('progressFill');
    currentStepSpan = document.getElementById('currentStep');
    errorMessage = document.getElementById('errorMessage');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    nicknameInput = document.getElementById('nickname');
    mbtiSelect = document.getElementById('mbti');
    seeSampleBtn = document.getElementById('seeSampleBtn');
    resultNickname = document.getElementById('resultNickname');
    resultMbti = document.getElementById('resultMbti');
    restartBtn = document.getElementById('restartBtn');
    btnGoProfile = document.getElementById('btnGoProfile');
    btnSkipProfile = document.getElementById('btnSkipProfile');
    quizQuestions = document.getElementById('quizQuestions');
    finalResult = document.getElementById('finalResult');

    // A. 从 DOM 读取当前 active 的 step 作为 currentStep
    const activeStep = document.querySelector('.step.active');
    if (activeStep) {
        const stepId = activeStep.id;
        const stepNum = stepId.replace('step', '');
        currentStep = parseInt(stepNum) || 1;
    }

    // B. 所有 addEventListener 前都做元素存在性判断
    if (prevBtn) prevBtn.addEventListener('click', handlePrev);
    if (nextBtn) nextBtn.addEventListener('click', handleNext);
    if (seeSampleBtn) seeSampleBtn.addEventListener('click', handleSeeSample);
    if (restartBtn) restartBtn.addEventListener('click', handleRestart);
    if (btnGoProfile) btnGoProfile.addEventListener('click', handleGoProfile);
    if (btnSkipProfile) btnSkipProfile.addEventListener('click', handleSkipProfile);

    // 实时保存 Step 1 的输入
    if (nicknameInput) {
        nicknameInput.addEventListener('input', function() {
            userInfo.nickname = this.value.trim();
        });
    }

    if (mbtiSelect) {
        mbtiSelect.addEventListener('change', function() {
            userInfo.mbti = this.value;
        });
    }

    // 实时保存 Step 4 的单选按钮
    saveFinancialProfileAnswers();

    // 渲染 Step2 的题目
    renderQuizQuestions();
});

// ==================== 步骤切换功能 ====================

// 上一步按钮处理
function handlePrev() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

// 下一步按钮处理
function handleNext() {
    // 根据当前步骤进行验证和跳转
    if (currentStep === 1) {
        // 验证 Step 1（昵称 + MBTI）
        if (validateStep1()) {
            goToStep(2);
        }
    } else if (currentStep === 2) {
        // Step 2：校验答题并计算结果
        const collection = collectAnswersFromUI();

        if (!collection.ok) {
            // 显示错误提示
            showError(collection.message || '请先完成所有题目～');
            return;
        }

        // 清空错误提示
        hideError();

        // 调用数据层函数计算
        const answers = collection.answers;
        const rawScores = computeRawScores(answers);
        const profile = finalizeProfile(rawScores);
        const archetypeId = pickArchetype(profile);
        const archetype = archetypes.find(a => a.id === archetypeId) || null;

        // 保存到 resultState
        resultState = {
            answers,
            rawScores,
            profile,
            archetypeId,
            archetype,
            finalProfile: null,
            finalArchetypeId: null,
            finalArchetype: null
        };

        // [STEP3] 详细调试日志
        console.log('[MBTI][STEP3] ========== 测评完成 ==========');
        console.log('[MBTI][STEP3] answers:', answers);
        console.log('[MBTI][STEP3] rawScores:', rawScores);
        console.log('[MBTI][STEP3] profile:', profile);
        console.log('[MBTI][STEP3] archetypeId:', archetypeId);

        // 进入 Step 3
        goToStep(3);
    } else if (currentStep === 4) {
        // Step 4：验证财务画像，完成后调整结果并回到 Step 3
        if (validateFinancialProfile()) {
            // [STEP4][INPUT] 详细调试日志
            console.log('[MBTI][STEP4] ========== 精准调整开始 ==========');
            console.log('[MBTI][STEP4][INPUT] userFinancialProfile:', userFinancialProfile);

            // 基于财务画像进行精准调整
            adjustResultWithFinancialProfile();
            goToStep(3);
        }
    }
}

// Step 2 查看示例结果按钮处理 → 生成随机答案并跳到 Step 3
function handleSeeSample() {
    // 生成随机答案
    const answers = {};
    for (let i = 1; i <= 12; i++) {
        const qId = 'q' + i;
        answers[qId] = Math.floor(Math.random() * 4);
    }

    // 调用数据层函数计算
    const rawScores = computeRawScores(answers);
    const profile = finalizeProfile(rawScores);
    const archetypeId = pickArchetype(profile);
    const archetype = archetypes.find(a => a.id === archetypeId) || null;

    // 保存到 resultState
    resultState = {
        answers,
        rawScores,
        profile,
        archetypeId,
        archetype,
        finalProfile: null,
        finalArchetypeId: null,
        finalArchetype: null
    };

    console.log('[MBTI] 示例结果（随机）：', resultState);

    goToStep(3);
}

// Step 3 更精准去补充按钮处理 → 跳到 Step 4
function handleGoProfile() {
    goToStep(4);
}

// Step 3 先看推荐跳过按钮处理
function handleSkipProfile() {
    // 显示跳过提示
    const skipNote = document.getElementById('skipNote');
    if (skipNote) skipNote.hidden = false;

    // 禁用按钮，避免重复点击
    if (btnSkipProfile) {
        btnSkipProfile.disabled = true;
        btnSkipProfile.textContent = '已跳过 ✅';
    }
}

// Step 3 重新开始按钮处理 → 回到 Step 1，保留昵称，清空 MBTI
function handleRestart() {
    // 保存当前昵称（不清空）
    const savedNickname = userInfo.nickname;

    // 清空用户数据：MBTI 清空，昵称保留
    userInfo = {
        nickname: savedNickname || '',  // 保留昵称
        mbti: ''                        // 清空 MBTI
    };

    // 清空财务画像数据
    userFinancialProfile = {
        ageRange: '',
        jobType: '',
        incomeRange: '',
        lumpSumBudget: '',
        monthlyContribution: '',
        mainGoal: '',
        horizon: '',
        liquidityNeed: ''
    };

    // 清空 MBTI 测评结果状态
    resultState = {
        answers: null,
        rawScores: null,
        profile: null,
        archetypeId: null,
        archetype: null,
        finalProfile: null,
        finalArchetypeId: null,
        finalArchetype: null
    };

    // 清空表单输入：MBTI 清空，昵称不清空
    // nicknameInput.value = '';  // 不清空昵称
    if (mbtiSelect) mbtiSelect.value = '';         // 清空 MBTI

    // 清空所有单选按钮
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });

    // 隐藏错误提示
    hideError();

    // 重置跳过提示状态
    const skipNote = document.getElementById('skipNote');
    if (skipNote) skipNote.hidden = true;

    if (btnSkipProfile) {
        btnSkipProfile.disabled = false;
        btnSkipProfile.textContent = '先看推荐（跳过）';
    }

    // 回到 Step 1
    goToStep(1);

    // 确保昵称输入框显示保留的值
    if (nicknameInput && savedNickname) {
        nicknameInput.value = savedNickname;
    }
}

// C. 跳转到指定步骤（带边界保护）
function goToStep(stepNumber) {
    // 边界保护：steps[stepNumber] 不存在时直接 return
    if (!steps[stepNumber]) {
        console.warn('goToStep: step ' + stepNumber + ' 不存在');
        return;
    }

    // 隐藏当前步骤
    if (steps[currentStep]) {
        steps[currentStep].classList.remove('active');
    }

    // 更新当前步骤
    currentStep = stepNumber;

    // 显示新步骤
    if (steps[currentStep]) {
        steps[currentStep].classList.add('active');
    }

    // 更新进度条
    updateProgress();

    // 更新按钮状态
    updateButtons();

    // E. 如果是 Step 3（结果页），显示结果
    if (currentStep === 3) {
        showResult();
    }

    // F. 如果是 Step 4（精准结果页），渲染最终结果
    if (currentStep === 4) {
        renderFinalResult();
    }
}

// 更新进度条
function updateProgress() {
    if (progressFill) {
        // 计算进度百分比（总共 4 步）
        const percentage = (currentStep / 4) * 100;
        progressFill.style.width = percentage + '%';
    }

    if (currentStepSpan) {
        // 更新步骤指示器文字
        currentStepSpan.textContent = currentStep;
    }
}

// D. 更新按钮状态
function updateButtons() {
    if (!prevBtn || !nextBtn) return;

    // 上一步按钮：第一步时禁用
    prevBtn.disabled = (currentStep === 1);

    // 下一步按钮：
    // - Step1/2：显示（Step1 的 prev disabled）
    // - Step3：隐藏 next（保留 prev）
    // - Step4：显示 next 且文字为"完成并查看结果"
    if (currentStep === 3) {
        // 结果页不显示下一步按钮，使用分流交互按钮
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'block';
    } else if (currentStep === 4) {
        // 财务画像页，next 按钮作为完成按钮
        nextBtn.style.display = 'block';
        nextBtn.textContent = '完成并查看结果';
        prevBtn.style.display = 'block';
    } else {
        // Step1/2
        nextBtn.style.display = 'block';
        nextBtn.textContent = '下一步';
        prevBtn.style.display = 'block';
    }
}

// ==================== 题目渲染与答案收集 ====================

// 渲染题目到 Step2（幂等：只渲染一次）
function renderQuizQuestions() {
    if (!quizQuestions) return;

    // 如果已经渲染过，不再重复渲染
    if (quizQuestions.children.length > 0) return;

    // 清空容器
    quizQuestions.innerHTML = '';

    // 遍历 questions 生成 DOM
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-group';
        questionDiv.setAttribute('data-qid', q.id);

        // 题目标题
        const title = document.createElement('h3');
        title.className = 'question-title';
        title.textContent = `${index + 1}. ${q.text}`;
        questionDiv.appendChild(title);

        // 选项容器
        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';

        // 遍历选项
        q.options.forEach((opt, optIndex) => {
            const optionLabel = document.createElement('label');
            optionLabel.className = 'option-card';

            const radio = document.createElement('input');
            radio.className = 'option-radio';
            radio.type = 'radio';
            radio.name = q.id;
            radio.value = optIndex;

            const optionText = document.createElement('span');
            optionText.className = 'option-text';
            optionText.textContent = opt.text;

            optionLabel.appendChild(radio);
            optionLabel.appendChild(optionText);
            optionsGrid.appendChild(optionLabel);
        });

        questionDiv.appendChild(optionsGrid);
        quizQuestions.appendChild(questionDiv);
    });

    console.log('[题目渲染] 已渲染 ' + questions.length + ' 道题目');
}

// 收集答案并校验
function collectAnswersFromUI() {
    const answers = {};

    // 遍历 questions 检查每题是否已选
    for (const q of questions) {
        const chosen = document.querySelector(`input[name="${q.id}"]:checked`);

        if (!chosen) {
            return {
                ok: false,
                message: `请先完成所有题目～`
            };
        }

        answers[q.id] = Number(chosen.value);
    }

    return {
        ok: true,
        answers
    };
}

// ==================== 表单验证功能 ====================

// 验证 Step 1（只要求昵称必填，MBTI 可以为空）
function validateStep1() {
    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
    const mbti = mbtiSelect ? mbtiSelect.value : '';

    // 检查昵称（必填）
    if (!nickname) {
        showError('记得给自己起个昵称哦～ 🏷️');
        return false;
    }

    // MBTI 可以为空，不检查

    // 保存到 userInfo
    userInfo.nickname = nickname;
    userInfo.mbti = mbti;  // 允许为空字符串

    return true;
}

// 验证财务画像问卷（Step 4）
function validateFinancialProfile() {
    // 获取 Step4 中所有问题组
    const questionGroups = document.querySelectorAll('#step4 .question-group');

    // 遍历每个问题组，检查是否已选择
    for (let group of questionGroups) {
        const questionName = group.getAttribute('data-question');
        const selectedOption = document.querySelector(`input[name="${questionName}"]:checked`);

        if (!selectedOption) {
            showError('有些问题还没选完，我们一起补一补～ ✨');
            return false;
        }

        // 保存到 userFinancialProfile
        userFinancialProfile[questionName] = selectedOption.value;
    }

    // 在控制台打印保存的数据（方便调试）
    console.log('用户信息:', userInfo);
    console.log('财务画像:', userFinancialProfile);

    return true;
}

// ==================== 实时保存财务画像问卷的答案（Step 4）====================

function saveFinancialProfileAnswers() {
    // 监听 Step4 中所有单选按钮的变化
    document.querySelectorAll('#step4 input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const questionName = this.name;
            userFinancialProfile[questionName] = this.value;
        });
    });
}

// ==================== 错误提示功能 ====================

// 显示错误提示
function showError(message) {
    if (!errorMessage) return;

    errorMessage.textContent = message;
    errorMessage.classList.add('show');

    // 3秒后自动隐藏
    setTimeout(hideError, 3000);
}

// 隐藏错误提示
function hideError() {
    if (!errorMessage) return;
    errorMessage.classList.remove('show');
}

// ==================== 财务画像精准调整 ====================

// 基于 Step4 财务画像调整测评结果
function adjustResultWithFinancialProfile() {
    // 如果没有原始结果，不处理
    if (!resultState || !resultState.profile) {
        console.warn('[财务画像调整] 没有原始测评结果，跳过调整');
        return;
    }

    console.log('[MBTI][STEP4][ADJUST] 原始 profile:', resultState.profile);

    // 1. 根据财务画像构造调整参数
    const adjustments = {
        liquidity: 0,
        horizon: 0,
        discipline: 0,
        stability: 0,
        risk: 0,
        growth: 0,
        emotion: 0,
        involvement: 0
    };

    // 映射规则：根据财务画像回答调整对应维度
    const fp = userFinancialProfile || {};

    // 安全检查：确保 fp 存在且有数据
    if (!fp || Object.keys(fp).length === 0) {
        console.warn('[MBTI][STEP4][ADJUST] 财务画像为空，跳过调整');
        return;
    }

    // ageRange: 年龄越大，越保守
    if (fp.ageRange === '46-60' || fp.ageRange === 'over60') {
        adjustments.stability += 10;
        adjustments.risk -= 10;
    } else if (fp.ageRange === 'under25') {
        adjustments.risk += 5;
        adjustments.growth += 5;
    }

    // incomeRange: 收入越高，越能承受波动
    if (fp.incomeRange === '30k-50k' || fp.incomeRange === 'over50k') {
        adjustments.risk += 8;
        adjustments.growth += 5;
    } else if (fp.incomeRange === 'under5k') {
        adjustments.stability += 8;
        adjustments.liquidity += 5;
    }

    // lumpSumBudget: 有一次性投入，说明有一定积累
    if (fp.lumpSumBudget === '20k-100k' || fp.lumpSumBudget === 'over100k') {
        adjustments.discipline += 5;
        adjustments.growth += 5;
    }

    // monthlyContribution: 有定投习惯，说明自律
    if (fp.monthlyContribution === '1k-3k' || fp.monthlyContribution === 'over3k') {
        adjustments.discipline += 10;
        adjustments.horizon += 5;
    }

    // mainGoal: 主要目标
    if (fp.mainGoal === 'safety') {
        adjustments.stability += 15;
        adjustments.risk -= 15;
    } else if (fp.mainGoal === 'growth') {
        adjustments.growth += 15;
        adjustments.risk += 10;
    } else if (fp.mainGoal === 'majorExpense' || fp.mainGoal === 'retirement') {
        adjustments.stability += 5;
        adjustments.horizon += 10;
        adjustments.discipline += 5;
    }

    // horizon: 投资期限
    if (fp.horizon === 'over5y' || fp.horizon === '3y-5y') {
        adjustments.horizon += 15;
        adjustments.growth += 8;
    } else if (fp.horizon === 'under1y') {
        adjustments.liquidity += 15;
        adjustments.stability += 10;
        adjustments.risk -= 10;
    }

    // liquidityNeed: 流动性需求
    if (fp.liquidityNeed === 'high') {
        adjustments.liquidity += 15;
        adjustments.stability += 10;
        adjustments.risk -= 10;
    } else if (fp.liquidityNeed === 'low') {
        adjustments.growth += 8;
        adjustments.risk += 5;
    }

    // 2. 应用调整到原始 profile（微调 +/- 5~15，clamp 0-100）
    const adjustedDims = {};
    for (const dim of DIM_KEYS) {
        const original = resultState.profile.dims[dim] || 50;
        const adjustment = adjustments[dim] || 0;
        let adjusted = original + adjustment;
        // clamp 0-100
        adjusted = Math.max(0, Math.min(100, adjusted));
        adjustedDims[dim] = adjusted;
    }

    // 3. 重新计算 riskIndex 和 band
    const riskIndex = recomputeRiskIndex(adjustedDims);

    let band = '均衡';
    if (riskIndex < 35) band = '保守';
    else if (riskIndex < 50) band = '稳健';
    else if (riskIndex < 65) band = '均衡';
    else band = '进取';

    // 构造最终 profile
    const finalProfile = {
        dims: adjustedDims,
        riskIndex,
        band
    };

    // 4. 重新选择动物原型
    const finalArchetypeId = pickArchetype(finalProfile);
    const finalArchetype = archetypes.find(a => a.id === finalArchetypeId) || null;

    // 5. 保存到 resultState
    resultState.finalProfile = finalProfile;
    resultState.finalArchetype = finalArchetype;
    resultState.finalArchetypeId = finalArchetypeId;

    // [STEP4][ADJUST] 详细调试日志
    console.log('[MBTI][STEP4][ADJUST] adjustments:', adjustments);
    console.log('[MBTI][STEP4][ADJUST] finalProfile:', finalProfile);
    console.log('[MBTI][STEP4][ADJUST] finalArchetypeId:', finalArchetypeId);
    console.log('[MBTI][STEP4][ADJUST] 原始 archetypeId → 最终 archetypeId:', resultState.archetypeId, '→', finalArchetypeId);
}

// 渲染 Step4 的精准结果
function renderFinalResult() {
    if (!finalResult) return;

    const archetype = resultState.finalArchetype;
    if (!archetype) {
        finalResult.style.display = 'none';
        return;
    }

    // 显示结果容器
    finalResult.style.display = 'block';
    finalResult.innerHTML = `
        <div class="final-archetype">
            <h2 class="archetype-title">🎯 你的精准基金人格</h2>
            <div class="archetype-header">
                <span class="archetype-animal">${archetype.animal}</span>
                <span class="archetype-name">${archetype.name}</span>
            </div>
            <p class="archetype-motto">"${archetype.motto}"</p>
            <div class="archetype-story">${archetype.story}</div>
            <div class="archetype-money-style">
                <h4>💰 你的基金组合</h4>
                <p><strong>主食：</strong>${archetype.moneyStyle.main}</p>
                <p><strong>配菜：</strong>${archetype.moneyStyle.side}</p>
                <p><strong>甜点：</strong>${archetype.moneyStyle.dessert}</p>
            </div>
            <div class="archetype-reminder">
                <h4>💡 温馨提醒</h4>
                <p>${archetype.reminder[0]}</p>
                <p>${archetype.reminder[1]}</p>
            </div>
        </div>
    `;
}

// 重新计算 riskIndex（与 finalizeProfile 中的公式相同）
function recomputeRiskIndex(dims) {
    let riskIndex =
        0.28 * dims.risk +
        0.22 * dims.growth +
        0.15 * dims.emotion +
        0.12 * dims.horizon +
        0.10 * dims.involvement +
        0.08 * (100 - dims.stability) +
        0.05 * (100 - dims.liquidity);

    return Math.round(Math.max(0, Math.min(100, riskIndex)));
}

// ==================== 显示结果 ====================

// E. showResult 在进入 Step3 时调用，填充昵称/MBTI 并渲染 archetype
function showResult() {
    if (resultNickname) {
        resultNickname.textContent = userInfo.nickname || '神秘访客';
    }

    if (resultMbti) {
        resultMbti.textContent = userInfo.mbti || '????';
    }

    // 渲染动物原型结果
    renderArchetypeResult();
}

// 渲染动物原型到第一个结果卡片
function renderArchetypeResult() {
    // 确定 archetype：
    // 1. 优先使用 finalArchetype（如果存在，说明已补充财务画像）
    // 2. 否则使用 archetype（原始测评结果）
    // 3. 如果都没有，使用默认 A2 示例
    let archetype = null;
    let isFinal = false;

    if (resultState && resultState.finalArchetype) {
        archetype = resultState.finalArchetype;
        isFinal = true;
    } else if (resultState && resultState.archetype) {
        archetype = resultState.archetype;
    } else {
        // 默认示例：A2 半糖小鹿
        archetype = archetypes.find(a => a.id === 'A2') || null;
    }

    if (!archetype) return;

    // 找到第一个结果卡片（基金人格卡片）
    const firstCard = document.querySelector('#step3 .result-cards .result-card:first-child');
    if (!firstCard) return;

    // 如果是精准结果，添加标记
    const precisionTag = isFinal ? '<p class="precision-tag">✨ 基于你的财务情况精准调整</p>' : '';

    // 渲染 archetype 内容
    firstCard.innerHTML = `
        ${precisionTag}
        <div class="archetype-icon">${archetype.animal}</div>
        <h3 class="archetype-name">${archetype.name}</h3>
        <p class="archetype-motto">${archetype.motto}</p>
        <div class="archetype-story">${archetype.story}</div>
        <div class="archetype-money-style">
            <div class="money-style-item">
                <span class="money-label">主食：</span>
                <span>${archetype.moneyStyle.main}</span>
            </div>
            <div class="money-style-item">
                <span class="money-label">配菜：</span>
                <span>${archetype.moneyStyle.side}</span>
            </div>
            <div class="money-style-item">
                <span class="money-label">甜点：</span>
                <span>${archetype.moneyStyle.dessert}</span>
            </div>
        </div>
        <div class="archetype-reminder">
            <p>💡 ${archetype.reminder[0]}</p>
            <p>💡 ${archetype.reminder[1]}</p>
        </div>
    `;
}

// ==================== MBTI 测评数据层 ====================

// 维度统一（8维 key）
const DIM_KEYS = ['risk', 'stability', 'growth', 'horizon', 'liquidity', 'emotion', 'involvement', 'discipline'];

// 题库
const questions = [
  {
    id: 'q1',
    text: '早上出门发现下雨，但你没带伞，你更像：',
    options: [
      { text: 'A. 先找便利店买伞：稳稳当当', score: { stability: +3, discipline: +2, risk: -1 } },
      { text: 'B. 先躲屋檐，看看雨会不会停', score: { emotion: +1, horizon: +1, involvement: +1 } },
      { text: 'C. 直接冲！反正也就湿一点', score: { risk: +3, growth: +1, emotion: +1 } },
      { text: 'D. 叫车回去拿伞：安全第一', score: { stability: +4, liquidity: +1, risk: -2 } }
    ]
  },
  {
    id: 'q2',
    text: '你买奶茶时最常点的是：',
    options: [
      { text: 'A. 经典款，甜度固定不折腾', score: { stability: +3, discipline: +1 } },
      { text: 'B. 半糖去冰：平衡型', score: { stability: +1, growth: +1 } },
      { text: 'C. 新品必须尝鲜！', score: { growth: +3, risk: +2, involvement: +1 } },
      { text: 'D. 今天想喝哪杯都行，看心情', score: { emotion: -1, involvement: -1, liquidity: +1 } }
    ]
  },
  {
    id: 'q3',
    text: '你的手机相册更像：',
    options: [
      { text: 'A. 分类清晰：旅行/美食/截图分文件夹', score: { discipline: +3, involvement: +1, stability: +1 } },
      { text: 'B. 不分类，但需要时也能翻到', score: { discipline: +1, emotion: +1 } },
      { text: 'C. 超乱，但我觉得这就是生活', score: { discipline: -2, emotion: -1 } },
      { text: 'D. 我会定期清理，保持"干净"', score: { discipline: +4, stability: +2 } }
    ]
  },
  {
    id: 'q4',
    text: '如果你买的东西第二天降价了，你会：',
    options: [
      { text: 'A. 立刻申请价保/退差价', score: { involvement: +2, discipline: +2, emotion: +1 } },
      { text: 'B. 有点难受，但算了', score: { emotion: -1, stability: +1 } },
      { text: 'C. 当作买了"快乐"，继续逛新的', score: { emotion: +1, growth: +1, discipline: -1 } },
      { text: 'D. 下次再也不冲动买了（吸取教训）', score: { discipline: +3, stability: +2 } }
    ]
  },
  {
    id: 'q5',
    text: '你更能接受哪种"周末安排"？',
    options: [
      { text: 'A. 计划满满：上午运动下午学习', score: { discipline: +3, involvement: +2 } },
      { text: 'B. 半计划：留点空白给惊喜', score: { growth: +1, emotion: +1, horizon: +1 } },
      { text: 'C. 随缘：起床再说', score: { discipline: -2, emotion: -1 } },
      { text: 'D. 休息为主：好好充电最重要', score: { stability: +2, emotion: +1 } }
    ]
  },
  {
    id: 'q6',
    text: '你对"钱"的安全感更来自：',
    options: [
      { text: 'A. 看得见的余额（随时能用）', score: { liquidity: +4, stability: +2, risk: -2 } },
      { text: 'B. 有一笔应急金+其他再说', score: { liquidity: +2, stability: +2, discipline: +1 } },
      { text: 'C. 让钱慢慢变多（长期目标）', score: { horizon: +4, growth: +2, discipline: +1 } },
      { text: 'D. 学会让钱"自己工作"', score: { involvement: +3, growth: +2, risk: +1 } }
    ]
  },
  {
    id: 'q7',
    text: '如果你的投资账户一周内波动 -8%，你第一反应是：',
    options: [
      { text: 'A. 立刻想止损：先保住再说', score: { emotion: -3, stability: +3, risk: -3 } },
      { text: 'B. 有点慌，但我会先查原因', score: { emotion: -1, involvement: +2, discipline: +1 } },
      { text: 'C. 当作打折：如果逻辑没变就继续', score: { emotion: +3, horizon: +2, risk: +2 } },
      { text: 'D. 关掉APP，过几天再看', score: { emotion: +1, involvement: -1, discipline: +1 } }
    ]
  },
  {
    id: 'q8',
    text: '你更像哪种"学习模式"？',
    options: [
      { text: 'A. 我喜欢一步步学，会做笔记', score: { involvement: +3, discipline: +3 } },
      { text: 'B. 看短视频/图文，轻松了解就好', score: { involvement: +1, discipline: +1 } },
      { text: 'C. 我不太想学，想要一键省心', score: { involvement: -2, stability: +1 } },
      { text: 'D. 我喜欢研究对比，越学越上头', score: { involvement: +4, growth: +2, risk: +1 } }
    ]
  },
  {
    id: 'q9',
    text: '你的消费风格更像：',
    options: [
      { text: 'A. 先存钱再花钱：预算优先', score: { discipline: +4, stability: +2 } },
      { text: 'B. 该省省该花花：平衡型', score: { discipline: +2, growth: +1 } },
      { text: 'C. 及时行乐：快乐很重要', score: { liquidity: +2, discipline: -2, growth: +1 } },
      { text: 'D. 我更看重"长期值不值"', score: { horizon: +3, discipline: +2, involvement: +1 } }
    ]
  },
  {
    id: 'q10',
    text: '如果给你一个"稳稳赚 3%"和"可能赚 10%但也可能亏 5%"，你会：',
    options: [
      { text: 'A. 选稳稳 3%，我睡得更香', score: { stability: +4, risk: -3 } },
      { text: 'B. 大部分选稳，小部分尝试 10%', score: { stability: +2, growth: +2, risk: +1 } },
      { text: 'C. 选 10%：我愿意承担波动', score: { growth: +4, risk: +3, emotion: +1 } },
      { text: 'D. 看我最近要不要用钱再决定', score: { liquidity: +3, involvement: +1 } }
    ]
  },
  {
    id: 'q11',
    text: '你更喜欢的"投资频率"是：',
    options: [
      { text: 'A. 每月自动扣款：交给系统', score: { discipline: +4, stability: +1 } },
      { text: 'B. 每周看一次，有机会再加', score: { involvement: +2, discipline: +2 } },
      { text: 'C. 想起来就投：随缘', score: { discipline: -2, emotion: -1 } },
      { text: 'D. 我会分批/逢低加仓（更主动）', score: { involvement: +4, risk: +2, growth: +2 } }
    ]
  },
  {
    id: 'q12',
    text: '你希望自己一年后更像：',
    options: [
      { text: 'A. 变得更稳：财务不焦虑', score: { stability: +3, emotion: +2 } },
      { text: 'B. 变得更会规划：更自律', score: { discipline: +3, involvement: +1 } },
      { text: 'C. 变得更敢尝试：更有增长', score: { growth: +3, risk: +2 } },
      { text: 'D. 变得更自由：想用钱的时候不纠结', score: { liquidity: +3, horizon: +1 } }
    ]
  }
];

// 12种动物原型结果
const archetypes = [
  {
    id:'A1',
    name:'棉被仓鼠《稳稳睡神》',
    animal:'🐹',
    motto:'钱可以慢慢长，但我必须睡得香。',
    story:'你不是胆小，你是"会过日子"。你更喜欢那种看起来不刺激、但每天都在悄悄变好的感觉。你最擅长把"钱的事"做成生活习惯：像刷牙一样，不费劲但管用。你讨厌惊吓，所以你需要的是温柔的节奏。',
    moneyStyle:{
      main:'主食=稳稳当当；',
      side:'配菜=一点点变多；',
      dessert:'甜点=偶尔小尝试（很小很小）'
    },
    reminder:['别因为一次小起伏就"全盘否定"；','也别因为太追求稳就永远不敢升级。']
  },
  {
    id:'A2',
    name:'半糖小鹿《刚刚好选手》',
    animal:'🦌',
    motto:'别太刺激，也别太无聊，刚刚好最好。',
    story:'你很像点奶茶会选"半糖去冰"的人：舒服、耐喝、不会腻。你想变多，但不想被钱牵着情绪跑。你最适合"稳一点 + 长一点"的组合：让你既有安全感，也能看到进步。你不需要懂很多，先用简单的方式开始就很赢。',
    moneyStyle:{
      main:'主食=慢慢长；',
      side:'配菜=给你安心；',
      dessert:'甜点=小奖励（有也行没有也行）'
    },
    reminder:['别在"选哪个更完美"上耗太久；','你只要开始，后面可以再调整。']
  },
  {
    id:'A3',
    name:'海盐海豚《抗压小海豚》',
    animal:'🐬',
    motto:'先喝口水，再决定也不迟。',
    story:'你遇到小波动不会立刻炸毛，你会先看看发生了什么。你对"短期小风浪"比较淡定，像在海里游泳：浪来就换个姿势继续游。你更在意的是方向对不对，而不是今天好不好看。你的优势是"稳住心态"，这在钱的世界里很值钱。',
    moneyStyle:{
      main:'主食=长期路线；',
      side:'配菜=稳稳垫子；',
      dessert:'甜点=偶尔换口味（别太频繁）'
    },
    reminder:['淡定不等于放任不管；','给自己定个"每月体检日"就够。']
  },
  {
    id:'A4',
    name:'奶油英短《省心本心》',
    animal:'🐱',
    motto:'我想把脑子留给生活，不想天天盯数字。',
    story:'你不是不在乎钱，你只是更在乎"生活别被钱打扰"。你喜欢简单明确，不想每天做选择题。你最适合那种"设好一次、后面自动跑"的方式：像自动续费会员一样，省心但有效。你只要记得偶尔看看就好。',
    moneyStyle:{
      main:'主食=省心路线；',
      side:'配菜=一点点安心；',
      dessert:'甜点=限量尝鲜'
    },
    reminder:['别完全忘了它；','每月 5 分钟就能把你从焦虑里解放出来。']
  },
  {
    id:'A5',
    name:'企鹅队长《执行力王者》',
    animal:'🐧',
    motto:'我不靠灵感，我靠坚持。',
    story:'你最强的地方不是"猜对"，而是"做得到"。你一旦定下节奏，就会像企鹅列队一样整齐：每一步都算数。你适合把钱的事做成固定动作：每月一次，像交房租一样认真。你会在一年后突然发现：咦，怎么真的变不一样了？',
    moneyStyle:{
      main:'主食=固定节奏；',
      side:'配菜=稳稳垫子；',
      dessert:'甜点=小升级'
    },
    reminder:['别对自己太严苛；','偶尔忘一次也不代表失败。']
  },
  {
    id:'A6',
    name:'八卦鹦鹉《越学越上头》',
    animal:'🦜',
    motto:'我想搞懂！我想对比！我想知道为什么！',
    story:'你是那种"知道了原理就会安心"的人。你喜欢研究、对比、看别人怎么说，越看越有感觉。你的天赋是学习力强，但你的陷阱是：信息一多就手痒想换。给你一句魔法咒语：可以研究，但动作要慢。',
    moneyStyle:{
      main:'主食=简单地基；',
      side:'配菜=小范围探索；',
      dessert:'甜点=主题尝鲜（限量）'
    },
    reminder:['别把"学到的新东西"立刻变成"马上换"；','给自己一天冷静期你会更稳。']
  },
  {
    id:'A7',
    name:'冲浪海豹《敢冲但带救生衣》',
    animal:'🦭',
    motto:'我可以冲，但我不想翻车。',
    story:'你有冲劲，看到机会会兴奋，这是你可爱的地方。你不怕波动，但你讨厌"翻车后心态崩"。你最适合"冲一部分 + 稳一部分"的玩法：像冲浪一样，脚下要有板，身上要有绳。只要你守住边界，你会冲得很好看。',
    moneyStyle:{
      main:'主食=更敢一点；',
      side:'配菜=救生衣（稳住你）；',
      dessert:'甜点=分批加速'
    },
    reminder:['最危险不是跌，是"上头"；','先设上限，你就赢一半。']
  },
  {
    id:'A8',
    name:'计划狐狸《两条规则走天下》',
    animal:'🦊',
    motto:'我不想靠运气，我想靠方法。',
    story:'你喜欢有计划、有规则、有节奏。你不爱乱来，但你也不想太慢。你最适合"规则少但能执行"：两条就够——什么时候投、多久看一次。你的世界里，清晰=安心。',
    moneyStyle:{
      main:'主食=规则节奏；',
      side:'配菜=稳稳垫子；',
      dessert:'甜点=小小策略'
    },
    reminder:['规则别写成论文；','太复杂你反而会不想开始。']
  },
  {
    id:'A9',
    name:'蜂蜜小熊《温柔增长派》',
    animal:'🐻',
    motto:'不用爆甜，甜一点就很幸福。',
    story:'你追求的是"越来越踏实"，不是"突然很猛"。你喜欢慢慢变好，像蜂蜜一样：不刺激，但很耐久。你最适合走舒服的路线：不折腾、不吓人、但会稳稳往上。你会在某一天突然发现：哇，我真的变松弛了。',
    moneyStyle:{
      main:'主食=慢慢长；',
      side:'配菜=安心垫；',
      dessert:'甜点=偶尔升级'
    },
    reminder:['别因为温柔就永远不敢加一点点；','小小升级也很可爱。']
  },
  {
    id:'A10',
    name:'云朵兔兔《敏感但聪明》',
    animal:'🐰',
    motto:'我不是怕，我是对"惊吓"过敏。',
    story:'你对数字很敏感，这其实是保护机制。你不适合突然大起大落，你适合先把体验调到舒服：舒服了你才会坚持。你需要的是"循序渐进"：先小步，走稳了再加。你不是不行，你只是需要温柔一点的路。',
    moneyStyle:{
      main:'主食=更舒服的路线；',
      side:'配菜=一点点变多；',
      dessert:'甜点=小额试水'
    },
    reminder:['别用"别人敢"来逼自己；','你走自己的节奏，会更久更好。']
  },
  {
    id:'A11',
    name:'小象存钱罐《随时能用安心派》',
    animal:'🐘',
    motto:'我可以慢慢赚，但我不能突然没钱用。',
    story:'你最在意的是：要用钱的时候别慌。你很会把生活放在第一位，这不是保守，是成熟。你适合把钱分成两层：一层随时顶得上，一层慢慢变多。你一旦分清"哪笔钱是不能动的"，整个人都会松一口气。',
    moneyStyle:{
      main:'主食=随用安心层；',
      side:'配菜=慢慢变多层；',
      dessert:'甜点=小尝试'
    },
    reminder:['别把"长期的钱"拿来救短期情绪；','分层之后你会超级舒服。']
  },
  {
    id:'A12',
    name:'夜巡猫头鹰《理性观察员》',
    animal:'🦉',
    motto:'我想先看清楚，再出手。',
    story:'你不喜欢"别人说好就跟"，你更相信自己的判断。你会先观察、再小试、再慢慢加深——像猫头鹰夜里看路，慢一点但更准。你的挑战是：别观察到天荒地老。你只要"先用一点点开始"，就会越做越顺。',
    moneyStyle:{
      main:'主食=小额开始；',
      side:'配菜=固定节奏；',
      dessert:'甜点=逐步加深'
    },
    reminder:['最可惜的不是选错，是一直没开始；','从"很小很小"开始就够。']
  }
];

// 计算原始分数（兼容 answers 的 value 为 optionIndex 或 optionText）
function computeRawScores(answers) {
  const raw = {};
  DIM_KEYS.forEach((k) => { raw[k] = 0; });

  if (!answers || typeof answers !== 'object') return raw;

  for (const q of questions) {
    const v = answers[q.id];
    if (v === undefined || v === null) continue;

    let opt = null;

    if (typeof v === 'number') {
      opt = q.options[v] || null;
    } else if (typeof v === 'string') {
      opt = q.options.find((o) => o.text === v) || null;
    }

    if (!opt || !opt.score) continue;

    for (const [k, delta] of Object.entries(opt.score)) {
      if (!(k in raw)) raw[k] = 0;
      raw[k] += Number(delta) || 0;
    }
  }

  return raw;
}

// 归一化原始分数并计算风险等级
function finalizeProfile(rawScores) {
  const raw = {};
  DIM_KEYS.forEach((k) => { raw[k] = Number(rawScores?.[k]) || 0; });

  // 计算每维的理论 minSum/maxSum
  const minSum = {};
  const maxSum = {};
  DIM_KEYS.forEach((k) => { minSum[k] = 0; maxSum[k] = 0; });

  for (const q of questions) {
    for (const k of DIM_KEYS) {
      let minV = 0;
      let maxV = 0;

      let seen = false;
      for (const opt of q.options) {
        const val = Number(opt.score?.[k]);
        if (!Number.isFinite(val)) continue;
        if (!seen) {
          minV = val; maxV = val; seen = true;
        } else {
          if (val < minV) minV = val;
          if (val > maxV) maxV = val;
        }
      }

      // 如果该题该维从未出现分数，则保持 0/0
      if (!seen) { minV = 0; maxV = 0; }

      minSum[k] += minV;
      maxSum[k] += maxV;
    }
  }

  // 归一化
  const dims = {};
  for (const k of DIM_KEYS) {
    const denom = (maxSum[k] - minSum[k]);
    let norm = 50;
    if (denom !== 0) {
      norm = ((raw[k] - minSum[k]) / denom) * 100;
    }
    // clamp & round
    norm = Math.max(0, Math.min(100, norm));
    dims[k] = Math.round(norm);
  }

  // riskIndex（越大越敢冲）
  let riskIndex =
    0.28 * dims.risk +
    0.22 * dims.growth +
    0.15 * dims.emotion +
    0.12 * dims.horizon +
    0.10 * dims.involvement +
    0.08 * (100 - dims.stability) +
    0.05 * (100 - dims.liquidity);

  riskIndex = Math.round(Math.max(0, Math.min(100, riskIndex)));

  let band = '均衡';
  if (riskIndex < 35) band = '保守';
  else if (riskIndex < 50) band = '稳健';
  else if (riskIndex < 65) band = '均衡';
  else band = '进取';

  return { dims, riskIndex, band };
}

// 根据 profile 选择动物原型
function pickArchetype(profile) {
  const dims = profile?.dims || {};
  const band = profile?.band || '均衡';

  const get = (k) => Number(dims?.[k]) || 0;

  if (band === '保守') {
    if (get('liquidity') >= 70) return 'A11';
    if (get('emotion') <= 40) return 'A10';
    return 'A1';
  }

  if (band === '稳健') {
    if (get('involvement') <= 35) return 'A4';
    if (get('discipline') >= 70) return 'A5';
    return 'A9';
  }

  if (band === '均衡') {
    if (get('involvement') >= 70) return 'A6';
    if (get('emotion') >= 65) return 'A3';
    return 'A2';
  }

  if (band === '进取') {
    if (get('discipline') >= 70 && get('involvement') >= 60) return 'A8';
    return 'A7';
  }

  // 兜底
  return 'A2';
}

// ==================== 数据层结束 ====================
