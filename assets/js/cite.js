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

const anchor = (href, content) => {
    if (!content) content = href;
    const element = el('a')([txt(content)])
    element.href = href;
    return element
}

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
        const doixxx = doi => {
            if (!doi) return [];
            const now = new Date();
            return [
                txt(' Disponível em: <'),
                anchor(doi),
                txt(`>. Acesso em: ${now.getDate()} ${m[now.getMonth()-1]} de ${now.getFullYear()}.`)
            ];
        }
        return d => [
            ...auth(d.author),
            txt(` ${d.title}. `),
            b([txt(d.journal)]),
            txt(`, n. ${d.issue}, p. ${pag(d.page)}, ${dat(d.issued)}.`),
            ...doixxx(d.doi),
        ];
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
        const doixxx = doi => {
            if (!doi) return [];
            return [
                txt(' '),
                anchor(doi),
            ];
        }
        return d => [
            txt(auth(d.author)),
            txt(` (${year(d.issued)}). ${d.title}. `),
            italic([txt(d.journal)]),
            txt(`, ${d.issue}, ${pag(d.page)}.`),
            ...doixxx(d.doi),
        ];
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
        const doixxx = doi => {
            if (!doi) return [];
            return [
                txt(', DOI:'),
                anchor(doi, doi.replace(/https?:\/\/doi\.org\//, '')),
            ]
        };
        return d => {
            return [
                ...auth(d.author),
                txt(` (${year(d.issued)}) ‘${d.title},’ `),
                italic([txt(d.journal)]),
                txt(`, (${d.issue}), p${pag(d.page)}`),
                ...doixxx(d.doi),
                txt('.')
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
        const doixxx = doi => {
            if (!doi) return [];
            return [
                txt(' '),
                anchor(doi),
                txt('.')
            ]
        }
        return d => {
            return [
                txt(auth(d.author)),
                txt(`. ${d.title}. ${d.journal}. ${dat(d.issued)}; (${d.issue}):${pag(d.page)}.`),
                ...doixxx(d.doi),
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
        const doixxx = doi => {
            if (!doi) return [];
            return [
                txt(`
    doi = {`),
                anchor(doi),
                txt('},'),
            ]
        }
        const bt = d => {
            const tp = d.title.split(/\s+/);
            return [txt(`@article{${d.author[0].family.split(/\s+/).join('')}${year(d.issued)}${cap(tp.find(s => s.length > 1))},
    author = {${auth(d.author)}},
    title = {${tp.reduce((res, w, i) => res + ' ' + (i && isup(w[0]) ? wrp(w): w), '').trim()}},
    journal = {${d.journal}},
    number = {${d.issue}},
    year = {${year(d.issued)}},`),
    ...doixxx(d.doi),
txt(`
    pages = {${pages(d.page)}}
}`),
];
        };
        const code = d => {
            const c = el('code')(bt(d));
            c.className = 'language-bib';
            Prism.highlightElement(c);
            if (d.doi) {
                const xpath = `//span[text()='{${d.doi}}']`;
                const link = document.evaluate(xpath, c, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                for (const n of link.childNodes) {
                    link.removeChild(n)
                }

                link.appendChild(txt('{'));
                link.appendChild(anchor(d.doi));
                link.appendChild(txt('}'));
            }
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
