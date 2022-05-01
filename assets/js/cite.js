const cite = (function() {

const ini = n => {
    const r = [];
    let c = false;
    for (let p of n.split(/\s+/)) {
        if (c) {
            r[r.length - 1] += ' ' + p[0];
            c = false;
        } else {
            if (p[0].toLowerCase() == p[0]) {
                c = true;
                r.push(p);
            } else {
                r.push(p[0]);
            }
        }
    }
    return r;
}

const txt = t => document.createTextNode(t);

const apd = e => c => e.appendChild(c);

const el = t => (content = []) => {
    const e = document.createElement(t);
    content.forEach(apd(e));
    return e;
};

const italic = el('i');
const b = el('b');
const pag = p => {
    const parts = p.split('-');
    if (parts[0] === parts[1]) return parts[0];
    else return parts.join('–');
};
const year = i => i[0];

const isup = s => s.toUpperCase() === s;
const islw = s => s.toLowerCase() === s;
const ap = s => isup(s[s.length - 1]) ? s + '.' : s;
const prd = s => s[s.length - 1] === '.' ? s : s + '.';
const meng = ['Jan.', 'Feb.', 'Mar.', 'Abr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];

const fmt = {
    abnt: (() => {
        const m = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
        const dat = i => `${i[2]} ${m[i[1]-1]} ${i[0]}`;
        const nam = n => ap(`${n.family.toUpperCase()}, ${ini(n.given).join('. ')}`);
        const auth = a => a.length > 3 ? [txt(nam(a[0])), italic([txt(' et al.')])]: [txt(prd(a.map(n => nam(n)).join('; ')))];
        return d => {
            const now = new Date();
            const doi = d.doi
                ? ` Disponível em: <${d.doi}>. Acesso em: ${now.getDate()} ${m[now.getMonth()-1]} de ${now.getFullYear()}.`
                : '';
            return [
                ...auth(d.author),
                txt(` ${d.title}. `),
                b([txt(d.journal)]),
                txt(`, n. ${d.issue}, p. ${pag(d.page)}, ${dat(d.issued)}.${doi}`)
            ];
        };
    })(),
    apa: (() => {
        const nam = n => ap(`${n.family}, ${ini(n.given).join('. ')}`);
        const auth = a => {
            switch (a.length) {
                case 0: return '';
                case 1: return nam(a[0]);
                case 2:
                case 3: return [...a.slice(0, -1).map(nam), '& ' + nam(a[a.length-1])].join(', ');
                default: return ap(nam(a[0])) + 'et al';
            }
        };
        return d => {
            const doi = d.doi ? ` ${d.doi}` : '';
            return [
                txt(auth(d.author)),
                txt(` (${year(d.issued)}). ${d.title}. `),
                italic([txt(d.journal)]),
                txt(`, ${d.issue}, ${pag(d.page)}.${doi}`)
            ];
        };
    })(),
    hvd: (() => {
        const nam = n => {
            let res = n.family + ', ';
            for (let p of ini(n.given)) {
                if (islw(p[0])) res += ' ';
                res += p;
                if (isup(p[p.length-1])) res += '.';
            }
            return res;
        };
        const auth = a => {
            switch (a.length) {
                case 0: return [];
                case 1: return [txt(nam(a[0]))];
                case 2: return [txt([...a.slice(0, -1).map(nam)].join(', ') + ' & ' + nam(a[a.length-1]))];
                default: return [txt(nam(a[0]) + ' '), italic([txt(' et al.')])];
            }
        };
        return d => {
            const doi = d.doi ? `, DOI:${d.doi.replace(/https?:\/\/doi\.org\//, '')}` : '';
            return [
                ...auth(d.author),
                txt(` (${year(d.issued)}) ‘${d.title},’ `),
                italic([txt(d.journal)]),
                txt(`, (${d.issue}), p${pag(d.page)}${doi}.`)
            ];
        };
    })(),
    vcv: (() => {
        const dat = i => `${i[0]} ${meng[i[1]-1]} ${i[2].padStart(2, '0')}`;
        const nam = n => {
            let res = n.family + ' ';
            for (let p of ini(n.given)) {
                if (islw(p[0])) res += ' ';
                res += p;
            }
            return res;
        };
        const auth = a => a.map(nam).join(', ');
        return d => {
            const doi = d.doi ? ` ${d.doi}.` : '';
            return [
                txt(auth(d.author)),
                txt(`. ${d.title}. ${d.journal}. ${dat(d.issued)}; (${d.issue}):${pag(d.page)}.${doi}`)
            ];
        };
    })(),
    bbt: (() => {
        const nam = n => n.family + ', ' + n.given;
        const auth = a => a.map(nam).join(' and ')
        const cap = s => s[0].toUpperCase() + s.slice(1);
        const wrp = s => {
            const i = /[.,:;!?/'’"”\])}]$/.test(s) ? -1 : s.length;
            return `{${s.slice(0, i)}}${s.slice(i)}`;
        };
        const pages = p => {
            const parts = p.split('-');
            if (parts[0] == parts[1]) return parts[0];
            else return parts.join('--');
        };
        const bt = d => {
            const doi = d.doi ? `
    doi = {${d.doi}},` : '';
            const tp = d.title.split(/\s+/);
            return `@article{${d.author[0].family.split(/\s+/).join('')}${year(d.issued)}${cap(tp.find(s => s.length > 1))},
    author = {${auth(d.author)}},
    title = {${tp.reduce((res, w, i) => res + ' ' + (i && isup(w[0]) ? wrp(w): w), '').trim()}},
    journal = {${d.journal}},
    number = {${d.issue}},
    year = {${year(d.issued)}},${doi}
    pages = {${pages(d.page)}}
}`;
        };
        const code = d => {
            const c = el('code')([txt(bt(d))]);
            c.className = 'language-bib';
            Prism.highlightElement(c);
            return c;
        };

        return d => [el('pre')([code(d)])];
    })()
};

return (out, data) => f => {
    out.innerHTML = '';
    fmt[f](data).forEach(apd(out));
}

})();

// data = {
//     title: "Alfabetização do patrimônio: um laboratório de experiências",
//     author: [{"family":"Fontenele","given":"Hamanda Machado de Meneses"}],
//     journal: "Revista Galo",
//     page: "77-86",
//     issue: "2",
//     issued: ["2020", "10", "25",],
//     year: "2020",
// };
