// 管理后台逻辑
const STORAGE_KEY = 'dailyVerses';
const PWD_KEY = 'adminPwd';
const DEFAULT_PWD = 'admin123';

let verses = [];
let editIndex = -1;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    loadVerses();
    bindEvents();
    updateStats();
    updateDate();
});

function checkLogin() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn) {
        showPanel();
    }
}

function showPanel() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
}

function loadVerses() {
    const saved = localStorage.getItem(STORAGE_KEY);
    verses = saved ? JSON.parse(saved) : [...defaultVerses];
}

function saveVerses() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(verses));
}

function updateStats() {
    document.getElementById('totalVerses').textContent = verses.length;
}

function updateDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('zh-CN', options);
}

function bindEvents() {
    // 登录
    document.getElementById('loginForm').onsubmit = (e) => {
        e.preventDefault();
        const pwd = document.getElementById('password').value;
        const savedPwd = localStorage.getItem(PWD_KEY) || DEFAULT_PWD;
        if (pwd === savedPwd) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showPanel();
        } else {
            toast('密码错误');
        }
    };

    // 退出
    document.getElementById('logoutBtn').onclick = (e) => {
        e.preventDefault();
        sessionStorage.removeItem('adminLoggedIn');
        location.reload();
    };

    // 导航
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            switchPage(item.dataset.page);
        };
    });

    // 保存经文
    document.getElementById('saveBtn').onclick = saveVerse;
    document.getElementById('cancelBtn').onclick = () => {
        resetForm();
        switchPage('verses');
    };

    // 搜索
    document.getElementById('searchInput').oninput = (e) => {
        renderTable(e.target.value);
    };

    // 导出
    document.getElementById('exportBtn').onclick = exportData;
    
    // 导入
    document.getElementById('importBtn').onclick = () => {
        document.getElementById('importFile').click();
    };
    document.getElementById('importFile').onchange = importData;

    // 修改密码
    document.getElementById('changePwdBtn').onclick = () => {
        const newPwd = document.getElementById('newPassword').value.trim();
        if (newPwd.length < 4) {
            toast('密码至少4位');
            return;
        }
        localStorage.setItem(PWD_KEY, newPwd);
        document.getElementById('newPassword').value = '';
        toast('密码已更新');
    };

    // 清空数据
    document.getElementById('clearAllBtn').onclick = () => {
        if (confirm('确定要清空所有经文数据吗？此操作不可恢复！')) {
            verses = [];
            saveVerses();
            updateStats();
            renderTable();
            toast('数据已清空');
        }
    };
}


function switchPage(page) {
    // 更新导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // 切换页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');

    // 更新标题
    const titles = {
        dashboard: '概览',
        verses: '经文列表',
        add: editIndex >= 0 ? '编辑经文' : '添加经文',
        settings: '设置'
    };
    document.getElementById('pageTitle').textContent = titles[page];

    // 渲染表格
    if (page === 'verses') {
        renderTable();
    }
}

function renderTable(search = '') {
    const tbody = document.getElementById('verseTableBody');
    const filtered = verses.filter(v => 
        !search || 
        v.zh.includes(search) || 
        v.en.toLowerCase().includes(search.toLowerCase()) ||
        v.refZh.includes(search) ||
        v.refEn.toLowerCase().includes(search.toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text2)">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((v, i) => {
        const realIndex = verses.indexOf(v);
        return `
            <tr>
                <td>${realIndex + 1}</td>
                <td title="${v.zh}">${v.zh}</td>
                <td title="${v.en}">${v.en}</td>
                <td>${v.refZh}</td>
                <td>
                    <div class="table-actions">
                        <button class="icon-btn" onclick="editVerse(${realIndex})" title="编辑">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="icon-btn delete" onclick="deleteVerse(${realIndex})" title="删除">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function saveVerse() {
    const zh = document.getElementById('inputZh').value.trim();
    const en = document.getElementById('inputEn').value.trim();
    const refZh = document.getElementById('inputRefZh').value.trim();
    const refEn = document.getElementById('inputRefEn').value.trim();

    if (!zh || !en || !refZh || !refEn) {
        toast('请填写所有字段');
        return;
    }

    const verse = { zh, en, refZh, refEn };
    const idx = parseInt(document.getElementById('editIndex').value);

    if (idx >= 0) {
        verses[idx] = verse;
        toast('修改成功');
    } else {
        verses.push(verse);
        toast('添加成功');
    }

    saveVerses();
    updateStats();
    resetForm();
    switchPage('verses');
}

function editVerse(index) {
    const v = verses[index];
    document.getElementById('inputZh').value = v.zh;
    document.getElementById('inputEn').value = v.en;
    document.getElementById('inputRefZh').value = v.refZh;
    document.getElementById('inputRefEn').value = v.refEn;
    document.getElementById('editIndex').value = index;
    document.getElementById('formTitle').textContent = '编辑经文';
    editIndex = index;
    switchPage('add');
}

function deleteVerse(index) {
    if (confirm('确定删除这条经文吗？')) {
        verses.splice(index, 1);
        saveVerses();
        updateStats();
        renderTable();
        toast('已删除');
    }
}

function resetForm() {
    document.getElementById('inputZh').value = '';
    document.getElementById('inputEn').value = '';
    document.getElementById('inputRefZh').value = '';
    document.getElementById('inputRefEn').value = '';
    document.getElementById('editIndex').value = '-1';
    document.getElementById('formTitle').textContent = '添加新经文';
    editIndex = -1;
}

function exportData() {
    const data = JSON.stringify(verses, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verses_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('导出成功');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data)) {
                verses = [...verses, ...data];
                saveVerses();
                updateStats();
                renderTable();
                toast(`成功导入 ${data.length} 条经文`);
            } else {
                toast('文件格式错误');
            }
        } catch {
            toast('解析失败');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function toast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}
