class DailyVerse {
    constructor() {
        this.verses = this.loadVerses();
        this.current = null;
        this.lastIdx = -1;
        this.init();
    }

    loadVerses() {
        const saved = localStorage.getItem('dailyVerses');
        return saved ? JSON.parse(saved) : [...defaultVerses];
    }

    getRandom() {
        if (!this.verses.length) return null;
        let idx;
        do {
            idx = Math.floor(Math.random() * this.verses.length);
        } while (idx === this.lastIdx && this.verses.length > 1);
        this.lastIdx = idx;
        return this.verses[idx];
    }

    show() {
        this.current = this.getRandom();
        const container = document.querySelector('.verse-container');
        container.style.animation = 'none';
        container.offsetHeight;
        container.style.animation = 'fadeInUp 0.8s ease';

        if (!this.current) {
            document.getElementById('verseZh').textContent = '暂无经文';
            document.getElementById('verseEn').textContent = '';
            document.getElementById('verseRefZh').textContent = '';
            document.getElementById('verseRefEn').textContent = '';
            return;
        }
        this.render();
        this.loadBg();
    }

    render() {
        document.getElementById('verseZh').textContent = this.current.zh;
        document.getElementById('verseRefZh').textContent = '— ' + this.current.refZh;
        document.getElementById('verseEn').textContent = this.current.en;
        document.getElementById('verseRefEn').textContent = '— ' + this.current.refEn;
    }

    loadBg() {
        const bg = document.getElementById('bgImage');
        const ts = Date.now();
        bg.style.backgroundImage = `url('https://picsum.photos/1920/1080?random=${ts}')`;
    }

    share() {
        if (!this.current) return;
        const text = `${this.current.zh}\n— ${this.current.refZh}\n\n${this.current.en}\n— ${this.current.refEn}`;
        
        if (navigator.share) {
            navigator.share({ title: '每日经文', text });
        } else {
            navigator.clipboard.writeText(text);
            this.toast('已复制到剪贴板');
        }
    }

    toast(msg) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2000);
    }

    init() {
        document.getElementById('refreshBtn').onclick = () => this.show();
        document.getElementById('shareBtn').onclick = () => this.share();
        
        document.querySelector('.main-content').onclick = (e) => {
            if (!e.target.closest('button')) this.show();
        };

        this.show();
    }
}

document.addEventListener('DOMContentLoaded', () => new DailyVerse());
