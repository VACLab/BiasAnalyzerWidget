function wt(t, e) {
  return t == null || e == null ? NaN : t < e ? -1 : t > e ? 1 : t >= e ? 0 : NaN;
}
function vn(t, e) {
  return t == null || e == null ? NaN : e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
function Ve(t) {
  let e, n, r;
  t.length !== 2 ? (e = wt, n = (s, l) => wt(t(s), l), r = (s, l) => t(s) - l) : (e = t === wt || t === vn ? t : bn, n = t, r = t);
  function i(s, l, u = 0, c = s.length) {
    if (u < c) {
      if (e(l, l) !== 0) return c;
      do {
        const h = u + c >>> 1;
        n(s[h], l) < 0 ? u = h + 1 : c = h;
      } while (u < c);
    }
    return u;
  }
  function a(s, l, u = 0, c = s.length) {
    if (u < c) {
      if (e(l, l) !== 0) return c;
      do {
        const h = u + c >>> 1;
        n(s[h], l) <= 0 ? u = h + 1 : c = h;
      } while (u < c);
    }
    return u;
  }
  function o(s, l, u = 0, c = s.length) {
    const h = i(s, l, u, c - 1);
    return h > u && r(s[h - 1], l) > -r(s[h], l) ? h - 1 : h;
  }
  return { left: i, center: o, right: a };
}
function bn() {
  return 0;
}
function kn(t) {
  return t === null ? NaN : +t;
}
const Mn = Ve(wt), An = Mn.right;
Ve(kn).center;
class ge extends Map {
  constructor(e, n = $n) {
    if (super(), Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: n } }), e != null) for (const [r, i] of e) this.set(r, i);
  }
  get(e) {
    return super.get(me(this, e));
  }
  has(e) {
    return super.has(me(this, e));
  }
  set(e, n) {
    return super.set(Nn(this, e), n);
  }
  delete(e) {
    return super.delete(Sn(this, e));
  }
}
function me({ _intern: t, _key: e }, n) {
  const r = e(n);
  return t.has(r) ? t.get(r) : n;
}
function Nn({ _intern: t, _key: e }, n) {
  const r = e(n);
  return t.has(r) ? t.get(r) : (t.set(r, n), n);
}
function Sn({ _intern: t, _key: e }, n) {
  const r = e(n);
  return t.has(r) && (n = t.get(r), t.delete(r)), n;
}
function $n(t) {
  return t !== null && typeof t == "object" ? t.valueOf() : t;
}
const En = Math.sqrt(50), Cn = Math.sqrt(10), Tn = Math.sqrt(2);
function Mt(t, e, n) {
  const r = (e - t) / Math.max(0, n), i = Math.floor(Math.log10(r)), a = r / Math.pow(10, i), o = a >= En ? 10 : a >= Cn ? 5 : a >= Tn ? 2 : 1;
  let s, l, u;
  return i < 0 ? (u = Math.pow(10, -i) / o, s = Math.round(t * u), l = Math.round(e * u), s / u < t && ++s, l / u > e && --l, u = -u) : (u = Math.pow(10, i) * o, s = Math.round(t / u), l = Math.round(e / u), s * u < t && ++s, l * u > e && --l), l < s && 0.5 <= n && n < 2 ? Mt(t, e, n * 2) : [s, l, u];
}
function Rn(t, e, n) {
  if (e = +e, t = +t, n = +n, !(n > 0)) return [];
  if (t === e) return [t];
  const r = e < t, [i, a, o] = r ? Mt(e, t, n) : Mt(t, e, n);
  if (!(a >= i)) return [];
  const s = a - i + 1, l = new Array(s);
  if (r)
    if (o < 0) for (let u = 0; u < s; ++u) l[u] = (a - u) / -o;
    else for (let u = 0; u < s; ++u) l[u] = (a - u) * o;
  else if (o < 0) for (let u = 0; u < s; ++u) l[u] = (i + u) / -o;
  else for (let u = 0; u < s; ++u) l[u] = (i + u) * o;
  return l;
}
function Yt(t, e, n) {
  return e = +e, t = +t, n = +n, Mt(t, e, n)[2];
}
function Fn(t, e, n) {
  e = +e, t = +t, n = +n;
  const r = e < t, i = r ? Yt(e, t, n) : Yt(t, e, n);
  return (r ? -1 : 1) * (i < 0 ? 1 / -i : i);
}
function Bt(t, e) {
  let n;
  if (e === void 0)
    for (const r of t)
      r != null && (n < r || n === void 0 && r >= r) && (n = r);
  else {
    let r = -1;
    for (let i of t)
      (i = e(i, ++r, t)) != null && (n < i || n === void 0 && i >= i) && (n = i);
  }
  return n;
}
function Pn(t, e, n) {
  t = +t, e = +e, n = (i = arguments.length) < 2 ? (e = t, t = 0, 1) : i < 3 ? 1 : +n;
  for (var r = -1, i = Math.max(0, Math.ceil((e - t) / n)) | 0, a = new Array(i); ++r < i; )
    a[r] = t + r * n;
  return a;
}
function ye(t, e) {
  let n = 0;
  if (e === void 0)
    for (let r of t)
      (r = +r) && (n += r);
  else {
    let r = -1;
    for (let i of t)
      (i = +e(i, ++r, t)) && (n += i);
  }
  return n;
}
function In(t) {
  return t;
}
var Xt = 1, Ht = 2, Ut = 3, it = 4, xe = 1e-6;
function On(t) {
  return "translate(" + t + ",0)";
}
function zn(t) {
  return "translate(0," + t + ")";
}
function Dn(t) {
  return (e) => +t(e);
}
function Xn(t, e) {
  return e = Math.max(0, t.bandwidth() - e * 2) / 2, t.round() && (e = Math.round(e)), (n) => +t(n) + e;
}
function Hn() {
  return !this.__axis;
}
function Le(t, e) {
  var n = [], r = null, i = null, a = 6, o = 6, s = 3, l = typeof window < "u" && window.devicePixelRatio > 1 ? 0 : 0.5, u = t === Xt || t === it ? -1 : 1, c = t === it || t === Ht ? "x" : "y", h = t === Xt || t === Ut ? On : zn;
  function f(d) {
    var x = r ?? (e.ticks ? e.ticks.apply(e, n) : e.domain()), g = i ?? (e.tickFormat ? e.tickFormat.apply(e, n) : In), M = Math.max(a, 0) + s, C = e.range(), E = +C[0] + l, N = +C[C.length - 1] + l, p = (e.bandwidth ? Xn : Dn)(e.copy(), l), w = d.selection ? d.selection() : d, b = w.selectAll(".domain").data([null]), v = w.selectAll(".tick").data(x, e).order(), A = v.exit(), S = v.enter().append("g").attr("class", "tick"), $ = v.select("line"), y = v.select("text");
    b = b.merge(b.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "currentColor")), v = v.merge(S), $ = $.merge(S.append("line").attr("stroke", "currentColor").attr(c + "2", u * a)), y = y.merge(S.append("text").attr("fill", "currentColor").attr(c, u * M).attr("dy", t === Xt ? "0em" : t === Ut ? "0.71em" : "0.32em")), d !== w && (b = b.transition(d), v = v.transition(d), $ = $.transition(d), y = y.transition(d), A = A.transition(d).attr("opacity", xe).attr("transform", function(m) {
      return isFinite(m = p(m)) ? h(m + l) : this.getAttribute("transform");
    }), S.attr("opacity", xe).attr("transform", function(m) {
      var _ = this.parentNode.__axis;
      return h((_ && isFinite(_ = _(m)) ? _ : p(m)) + l);
    })), A.remove(), b.attr("d", t === it || t === Ht ? o ? "M" + u * o + "," + E + "H" + l + "V" + N + "H" + u * o : "M" + l + "," + E + "V" + N : o ? "M" + E + "," + u * o + "V" + l + "H" + N + "V" + u * o : "M" + E + "," + l + "H" + N), v.attr("opacity", 1).attr("transform", function(m) {
      return h(p(m) + l);
    }), $.attr(c + "2", u * a), y.attr(c, u * M).text(g), w.filter(Hn).attr("fill", "none").attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", t === Ht ? "start" : t === it ? "end" : "middle"), w.each(function() {
      this.__axis = p;
    });
  }
  return f.scale = function(d) {
    return arguments.length ? (e = d, f) : e;
  }, f.ticks = function() {
    return n = Array.from(arguments), f;
  }, f.tickArguments = function(d) {
    return arguments.length ? (n = d == null ? [] : Array.from(d), f) : n.slice();
  }, f.tickValues = function(d) {
    return arguments.length ? (r = d == null ? null : Array.from(d), f) : r && r.slice();
  }, f.tickFormat = function(d) {
    return arguments.length ? (i = d, f) : i;
  }, f.tickSize = function(d) {
    return arguments.length ? (a = o = +d, f) : a;
  }, f.tickSizeInner = function(d) {
    return arguments.length ? (a = +d, f) : a;
  }, f.tickSizeOuter = function(d) {
    return arguments.length ? (o = +d, f) : o;
  }, f.tickPadding = function(d) {
    return arguments.length ? (s = +d, f) : s;
  }, f.offset = function(d) {
    return arguments.length ? (l = +d, f) : l;
  }, f;
}
function qn(t) {
  return Le(Ut, t);
}
function Vn(t) {
  return Le(it, t);
}
var Ln = { value: () => {
} };
function It() {
  for (var t = 0, e = arguments.length, n = {}, r; t < e; ++t) {
    if (!(r = arguments[t] + "") || r in n || /[\s.]/.test(r)) throw new Error("illegal type: " + r);
    n[r] = [];
  }
  return new _t(n);
}
function _t(t) {
  this._ = t;
}
function Yn(t, e) {
  return t.trim().split(/^|\s+/).map(function(n) {
    var r = "", i = n.indexOf(".");
    if (i >= 0 && (r = n.slice(i + 1), n = n.slice(0, i)), n && !e.hasOwnProperty(n)) throw new Error("unknown type: " + n);
    return { type: n, name: r };
  });
}
_t.prototype = It.prototype = {
  constructor: _t,
  on: function(t, e) {
    var n = this._, r = Yn(t + "", n), i, a = -1, o = r.length;
    if (arguments.length < 2) {
      for (; ++a < o; ) if ((i = (t = r[a]).type) && (i = Bn(n[i], t.name))) return i;
      return;
    }
    if (e != null && typeof e != "function") throw new Error("invalid callback: " + e);
    for (; ++a < o; )
      if (i = (t = r[a]).type) n[i] = we(n[i], t.name, e);
      else if (e == null) for (i in n) n[i] = we(n[i], t.name, null);
    return this;
  },
  copy: function() {
    var t = {}, e = this._;
    for (var n in e) t[n] = e[n].slice();
    return new _t(t);
  },
  call: function(t, e) {
    if ((i = arguments.length - 2) > 0) for (var n = new Array(i), r = 0, i, a; r < i; ++r) n[r] = arguments[r + 2];
    if (!this._.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    for (a = this._[t], r = 0, i = a.length; r < i; ++r) a[r].value.apply(e, n);
  },
  apply: function(t, e, n) {
    if (!this._.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    for (var r = this._[t], i = 0, a = r.length; i < a; ++i) r[i].value.apply(e, n);
  }
};
function Bn(t, e) {
  for (var n = 0, r = t.length, i; n < r; ++n)
    if ((i = t[n]).name === e)
      return i.value;
}
function we(t, e, n) {
  for (var r = 0, i = t.length; r < i; ++r)
    if (t[r].name === e) {
      t[r] = Ln, t = t.slice(0, r).concat(t.slice(r + 1));
      break;
    }
  return n != null && t.push({ name: e, value: n }), t;
}
var Gt = "http://www.w3.org/1999/xhtml";
const _e = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: Gt,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
function Ot(t) {
  var e = t += "", n = e.indexOf(":");
  return n >= 0 && (e = t.slice(0, n)) !== "xmlns" && (t = t.slice(n + 1)), _e.hasOwnProperty(e) ? { space: _e[e], local: t } : t;
}
function Un(t) {
  return function() {
    var e = this.ownerDocument, n = this.namespaceURI;
    return n === Gt && e.documentElement.namespaceURI === Gt ? e.createElement(t) : e.createElementNS(n, t);
  };
}
function Gn(t) {
  return function() {
    return this.ownerDocument.createElementNS(t.space, t.local);
  };
}
function re(t) {
  var e = Ot(t);
  return (e.local ? Gn : Un)(e);
}
function Wn() {
}
function ie(t) {
  return t == null ? Wn : function() {
    return this.querySelector(t);
  };
}
function Kn(t) {
  typeof t != "function" && (t = ie(t));
  for (var e = this._groups, n = e.length, r = new Array(n), i = 0; i < n; ++i)
    for (var a = e[i], o = a.length, s = r[i] = new Array(o), l, u, c = 0; c < o; ++c)
      (l = a[c]) && (u = t.call(l, l.__data__, c, a)) && ("__data__" in l && (u.__data__ = l.__data__), s[c] = u);
  return new O(r, this._parents);
}
function Zn(t) {
  return t == null ? [] : Array.isArray(t) ? t : Array.from(t);
}
function Jn() {
  return [];
}
function Ye(t) {
  return t == null ? Jn : function() {
    return this.querySelectorAll(t);
  };
}
function Qn(t) {
  return function() {
    return Zn(t.apply(this, arguments));
  };
}
function jn(t) {
  typeof t == "function" ? t = Qn(t) : t = Ye(t);
  for (var e = this._groups, n = e.length, r = [], i = [], a = 0; a < n; ++a)
    for (var o = e[a], s = o.length, l, u = 0; u < s; ++u)
      (l = o[u]) && (r.push(t.call(l, l.__data__, u, o)), i.push(l));
  return new O(r, i);
}
function Be(t) {
  return function() {
    return this.matches(t);
  };
}
function Ue(t) {
  return function(e) {
    return e.matches(t);
  };
}
var tr = Array.prototype.find;
function er(t) {
  return function() {
    return tr.call(this.children, t);
  };
}
function nr() {
  return this.firstElementChild;
}
function rr(t) {
  return this.select(t == null ? nr : er(typeof t == "function" ? t : Ue(t)));
}
var ir = Array.prototype.filter;
function ar() {
  return Array.from(this.children);
}
function or(t) {
  return function() {
    return ir.call(this.children, t);
  };
}
function sr(t) {
  return this.selectAll(t == null ? ar : or(typeof t == "function" ? t : Ue(t)));
}
function ur(t) {
  typeof t != "function" && (t = Be(t));
  for (var e = this._groups, n = e.length, r = new Array(n), i = 0; i < n; ++i)
    for (var a = e[i], o = a.length, s = r[i] = [], l, u = 0; u < o; ++u)
      (l = a[u]) && t.call(l, l.__data__, u, a) && s.push(l);
  return new O(r, this._parents);
}
function Ge(t) {
  return new Array(t.length);
}
function lr() {
  return new O(this._enter || this._groups.map(Ge), this._parents);
}
function At(t, e) {
  this.ownerDocument = t.ownerDocument, this.namespaceURI = t.namespaceURI, this._next = null, this._parent = t, this.__data__ = e;
}
At.prototype = {
  constructor: At,
  appendChild: function(t) {
    return this._parent.insertBefore(t, this._next);
  },
  insertBefore: function(t, e) {
    return this._parent.insertBefore(t, e);
  },
  querySelector: function(t) {
    return this._parent.querySelector(t);
  },
  querySelectorAll: function(t) {
    return this._parent.querySelectorAll(t);
  }
};
function cr(t) {
  return function() {
    return t;
  };
}
function fr(t, e, n, r, i, a) {
  for (var o = 0, s, l = e.length, u = a.length; o < u; ++o)
    (s = e[o]) ? (s.__data__ = a[o], r[o] = s) : n[o] = new At(t, a[o]);
  for (; o < l; ++o)
    (s = e[o]) && (i[o] = s);
}
function hr(t, e, n, r, i, a, o) {
  var s, l, u = /* @__PURE__ */ new Map(), c = e.length, h = a.length, f = new Array(c), d;
  for (s = 0; s < c; ++s)
    (l = e[s]) && (f[s] = d = o.call(l, l.__data__, s, e) + "", u.has(d) ? i[s] = l : u.set(d, l));
  for (s = 0; s < h; ++s)
    d = o.call(t, a[s], s, a) + "", (l = u.get(d)) ? (r[s] = l, l.__data__ = a[s], u.delete(d)) : n[s] = new At(t, a[s]);
  for (s = 0; s < c; ++s)
    (l = e[s]) && u.get(f[s]) === l && (i[s] = l);
}
function dr(t) {
  return t.__data__;
}
function pr(t, e) {
  if (!arguments.length) return Array.from(this, dr);
  var n = e ? hr : fr, r = this._parents, i = this._groups;
  typeof t != "function" && (t = cr(t));
  for (var a = i.length, o = new Array(a), s = new Array(a), l = new Array(a), u = 0; u < a; ++u) {
    var c = r[u], h = i[u], f = h.length, d = gr(t.call(c, c && c.__data__, u, r)), x = d.length, g = s[u] = new Array(x), M = o[u] = new Array(x), C = l[u] = new Array(f);
    n(c, h, g, M, C, d, e);
    for (var E = 0, N = 0, p, w; E < x; ++E)
      if (p = g[E]) {
        for (E >= N && (N = E + 1); !(w = M[N]) && ++N < x; ) ;
        p._next = w || null;
      }
  }
  return o = new O(o, r), o._enter = s, o._exit = l, o;
}
function gr(t) {
  return typeof t == "object" && "length" in t ? t : Array.from(t);
}
function mr() {
  return new O(this._exit || this._groups.map(Ge), this._parents);
}
function yr(t, e, n) {
  var r = this.enter(), i = this, a = this.exit();
  return typeof t == "function" ? (r = t(r), r && (r = r.selection())) : r = r.append(t + ""), e != null && (i = e(i), i && (i = i.selection())), n == null ? a.remove() : n(a), r && i ? r.merge(i).order() : i;
}
function xr(t) {
  for (var e = t.selection ? t.selection() : t, n = this._groups, r = e._groups, i = n.length, a = r.length, o = Math.min(i, a), s = new Array(i), l = 0; l < o; ++l)
    for (var u = n[l], c = r[l], h = u.length, f = s[l] = new Array(h), d, x = 0; x < h; ++x)
      (d = u[x] || c[x]) && (f[x] = d);
  for (; l < i; ++l)
    s[l] = n[l];
  return new O(s, this._parents);
}
function wr() {
  for (var t = this._groups, e = -1, n = t.length; ++e < n; )
    for (var r = t[e], i = r.length - 1, a = r[i], o; --i >= 0; )
      (o = r[i]) && (a && o.compareDocumentPosition(a) ^ 4 && a.parentNode.insertBefore(o, a), a = o);
  return this;
}
function _r(t) {
  t || (t = vr);
  function e(h, f) {
    return h && f ? t(h.__data__, f.__data__) : !h - !f;
  }
  for (var n = this._groups, r = n.length, i = new Array(r), a = 0; a < r; ++a) {
    for (var o = n[a], s = o.length, l = i[a] = new Array(s), u, c = 0; c < s; ++c)
      (u = o[c]) && (l[c] = u);
    l.sort(e);
  }
  return new O(i, this._parents).order();
}
function vr(t, e) {
  return t < e ? -1 : t > e ? 1 : t >= e ? 0 : NaN;
}
function br() {
  var t = arguments[0];
  return arguments[0] = this, t.apply(null, arguments), this;
}
function kr() {
  return Array.from(this);
}
function Mr() {
  for (var t = this._groups, e = 0, n = t.length; e < n; ++e)
    for (var r = t[e], i = 0, a = r.length; i < a; ++i) {
      var o = r[i];
      if (o) return o;
    }
  return null;
}
function Ar() {
  let t = 0;
  for (const e of this) ++t;
  return t;
}
function Nr() {
  return !this.node();
}
function Sr(t) {
  for (var e = this._groups, n = 0, r = e.length; n < r; ++n)
    for (var i = e[n], a = 0, o = i.length, s; a < o; ++a)
      (s = i[a]) && t.call(s, s.__data__, a, i);
  return this;
}
function $r(t) {
  return function() {
    this.removeAttribute(t);
  };
}
function Er(t) {
  return function() {
    this.removeAttributeNS(t.space, t.local);
  };
}
function Cr(t, e) {
  return function() {
    this.setAttribute(t, e);
  };
}
function Tr(t, e) {
  return function() {
    this.setAttributeNS(t.space, t.local, e);
  };
}
function Rr(t, e) {
  return function() {
    var n = e.apply(this, arguments);
    n == null ? this.removeAttribute(t) : this.setAttribute(t, n);
  };
}
function Fr(t, e) {
  return function() {
    var n = e.apply(this, arguments);
    n == null ? this.removeAttributeNS(t.space, t.local) : this.setAttributeNS(t.space, t.local, n);
  };
}
function Pr(t, e) {
  var n = Ot(t);
  if (arguments.length < 2) {
    var r = this.node();
    return n.local ? r.getAttributeNS(n.space, n.local) : r.getAttribute(n);
  }
  return this.each((e == null ? n.local ? Er : $r : typeof e == "function" ? n.local ? Fr : Rr : n.local ? Tr : Cr)(n, e));
}
function We(t) {
  return t.ownerDocument && t.ownerDocument.defaultView || t.document && t || t.defaultView;
}
function Ir(t) {
  return function() {
    this.style.removeProperty(t);
  };
}
function Or(t, e, n) {
  return function() {
    this.style.setProperty(t, e, n);
  };
}
function zr(t, e, n) {
  return function() {
    var r = e.apply(this, arguments);
    r == null ? this.style.removeProperty(t) : this.style.setProperty(t, r, n);
  };
}
function Dr(t, e, n) {
  return arguments.length > 1 ? this.each((e == null ? Ir : typeof e == "function" ? zr : Or)(t, e, n ?? "")) : tt(this.node(), t);
}
function tt(t, e) {
  return t.style.getPropertyValue(e) || We(t).getComputedStyle(t, null).getPropertyValue(e);
}
function Xr(t) {
  return function() {
    delete this[t];
  };
}
function Hr(t, e) {
  return function() {
    this[t] = e;
  };
}
function qr(t, e) {
  return function() {
    var n = e.apply(this, arguments);
    n == null ? delete this[t] : this[t] = n;
  };
}
function Vr(t, e) {
  return arguments.length > 1 ? this.each((e == null ? Xr : typeof e == "function" ? qr : Hr)(t, e)) : this.node()[t];
}
function Ke(t) {
  return t.trim().split(/^|\s+/);
}
function ae(t) {
  return t.classList || new Ze(t);
}
function Ze(t) {
  this._node = t, this._names = Ke(t.getAttribute("class") || "");
}
Ze.prototype = {
  add: function(t) {
    var e = this._names.indexOf(t);
    e < 0 && (this._names.push(t), this._node.setAttribute("class", this._names.join(" ")));
  },
  remove: function(t) {
    var e = this._names.indexOf(t);
    e >= 0 && (this._names.splice(e, 1), this._node.setAttribute("class", this._names.join(" ")));
  },
  contains: function(t) {
    return this._names.indexOf(t) >= 0;
  }
};
function Je(t, e) {
  for (var n = ae(t), r = -1, i = e.length; ++r < i; ) n.add(e[r]);
}
function Qe(t, e) {
  for (var n = ae(t), r = -1, i = e.length; ++r < i; ) n.remove(e[r]);
}
function Lr(t) {
  return function() {
    Je(this, t);
  };
}
function Yr(t) {
  return function() {
    Qe(this, t);
  };
}
function Br(t, e) {
  return function() {
    (e.apply(this, arguments) ? Je : Qe)(this, t);
  };
}
function Ur(t, e) {
  var n = Ke(t + "");
  if (arguments.length < 2) {
    for (var r = ae(this.node()), i = -1, a = n.length; ++i < a; ) if (!r.contains(n[i])) return !1;
    return !0;
  }
  return this.each((typeof e == "function" ? Br : e ? Lr : Yr)(n, e));
}
function Gr() {
  this.textContent = "";
}
function Wr(t) {
  return function() {
    this.textContent = t;
  };
}
function Kr(t) {
  return function() {
    var e = t.apply(this, arguments);
    this.textContent = e ?? "";
  };
}
function Zr(t) {
  return arguments.length ? this.each(t == null ? Gr : (typeof t == "function" ? Kr : Wr)(t)) : this.node().textContent;
}
function Jr() {
  this.innerHTML = "";
}
function Qr(t) {
  return function() {
    this.innerHTML = t;
  };
}
function jr(t) {
  return function() {
    var e = t.apply(this, arguments);
    this.innerHTML = e ?? "";
  };
}
function ti(t) {
  return arguments.length ? this.each(t == null ? Jr : (typeof t == "function" ? jr : Qr)(t)) : this.node().innerHTML;
}
function ei() {
  this.nextSibling && this.parentNode.appendChild(this);
}
function ni() {
  return this.each(ei);
}
function ri() {
  this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function ii() {
  return this.each(ri);
}
function ai(t) {
  var e = typeof t == "function" ? t : re(t);
  return this.select(function() {
    return this.appendChild(e.apply(this, arguments));
  });
}
function oi() {
  return null;
}
function si(t, e) {
  var n = typeof t == "function" ? t : re(t), r = e == null ? oi : typeof e == "function" ? e : ie(e);
  return this.select(function() {
    return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
  });
}
function ui() {
  var t = this.parentNode;
  t && t.removeChild(this);
}
function li() {
  return this.each(ui);
}
function ci() {
  var t = this.cloneNode(!1), e = this.parentNode;
  return e ? e.insertBefore(t, this.nextSibling) : t;
}
function fi() {
  var t = this.cloneNode(!0), e = this.parentNode;
  return e ? e.insertBefore(t, this.nextSibling) : t;
}
function hi(t) {
  return this.select(t ? fi : ci);
}
function di(t) {
  return arguments.length ? this.property("__data__", t) : this.node().__data__;
}
function pi(t) {
  return function(e) {
    t.call(this, e, this.__data__);
  };
}
function gi(t) {
  return t.trim().split(/^|\s+/).map(function(e) {
    var n = "", r = e.indexOf(".");
    return r >= 0 && (n = e.slice(r + 1), e = e.slice(0, r)), { type: e, name: n };
  });
}
function mi(t) {
  return function() {
    var e = this.__on;
    if (e) {
      for (var n = 0, r = -1, i = e.length, a; n < i; ++n)
        a = e[n], (!t.type || a.type === t.type) && a.name === t.name ? this.removeEventListener(a.type, a.listener, a.options) : e[++r] = a;
      ++r ? e.length = r : delete this.__on;
    }
  };
}
function yi(t, e, n) {
  return function() {
    var r = this.__on, i, a = pi(e);
    if (r) {
      for (var o = 0, s = r.length; o < s; ++o)
        if ((i = r[o]).type === t.type && i.name === t.name) {
          this.removeEventListener(i.type, i.listener, i.options), this.addEventListener(i.type, i.listener = a, i.options = n), i.value = e;
          return;
        }
    }
    this.addEventListener(t.type, a, n), i = { type: t.type, name: t.name, value: e, listener: a, options: n }, r ? r.push(i) : this.__on = [i];
  };
}
function xi(t, e, n) {
  var r = gi(t + ""), i, a = r.length, o;
  if (arguments.length < 2) {
    var s = this.node().__on;
    if (s) {
      for (var l = 0, u = s.length, c; l < u; ++l)
        for (i = 0, c = s[l]; i < a; ++i)
          if ((o = r[i]).type === c.type && o.name === c.name)
            return c.value;
    }
    return;
  }
  for (s = e ? yi : mi, i = 0; i < a; ++i) this.each(s(r[i], e, n));
  return this;
}
function je(t, e, n) {
  var r = We(t), i = r.CustomEvent;
  typeof i == "function" ? i = new i(e, n) : (i = r.document.createEvent("Event"), n ? (i.initEvent(e, n.bubbles, n.cancelable), i.detail = n.detail) : i.initEvent(e, !1, !1)), t.dispatchEvent(i);
}
function wi(t, e) {
  return function() {
    return je(this, t, e);
  };
}
function _i(t, e) {
  return function() {
    return je(this, t, e.apply(this, arguments));
  };
}
function vi(t, e) {
  return this.each((typeof e == "function" ? _i : wi)(t, e));
}
function* bi() {
  for (var t = this._groups, e = 0, n = t.length; e < n; ++e)
    for (var r = t[e], i = 0, a = r.length, o; i < a; ++i)
      (o = r[i]) && (yield o);
}
var tn = [null];
function O(t, e) {
  this._groups = t, this._parents = e;
}
function ht() {
  return new O([[document.documentElement]], tn);
}
function ki() {
  return this;
}
O.prototype = ht.prototype = {
  constructor: O,
  select: Kn,
  selectAll: jn,
  selectChild: rr,
  selectChildren: sr,
  filter: ur,
  data: pr,
  enter: lr,
  exit: mr,
  join: yr,
  merge: xr,
  selection: ki,
  order: wr,
  sort: _r,
  call: br,
  nodes: kr,
  node: Mr,
  size: Ar,
  empty: Nr,
  each: Sr,
  attr: Pr,
  style: Dr,
  property: Vr,
  classed: Ur,
  text: Zr,
  html: ti,
  raise: ni,
  lower: ii,
  append: ai,
  insert: si,
  remove: li,
  clone: hi,
  datum: di,
  on: xi,
  dispatch: vi,
  [Symbol.iterator]: bi
};
function I(t) {
  return typeof t == "string" ? new O([[document.querySelector(t)]], [document.documentElement]) : new O([[t]], tn);
}
function oe(t) {
  return I(re(t).call(document.documentElement));
}
function Mi(t) {
  let e;
  for (; e = t.sourceEvent; ) t = e;
  return t;
}
function ve(t, e) {
  if (t = Mi(t), e === void 0 && (e = t.currentTarget), e) {
    var n = e.ownerSVGElement || e;
    if (n.createSVGPoint) {
      var r = n.createSVGPoint();
      return r.x = t.clientX, r.y = t.clientY, r = r.matrixTransform(e.getScreenCTM().inverse()), [r.x, r.y];
    }
    if (e.getBoundingClientRect) {
      var i = e.getBoundingClientRect();
      return [t.clientX - i.left - e.clientLeft, t.clientY - i.top - e.clientTop];
    }
  }
  return [t.pageX, t.pageY];
}
const Ai = { passive: !1 }, ut = { capture: !0, passive: !1 };
function qt(t) {
  t.stopImmediatePropagation();
}
function Q(t) {
  t.preventDefault(), t.stopImmediatePropagation();
}
function Ni(t) {
  var e = t.document.documentElement, n = I(t).on("dragstart.drag", Q, ut);
  "onselectstart" in e ? n.on("selectstart.drag", Q, ut) : (e.__noselect = e.style.MozUserSelect, e.style.MozUserSelect = "none");
}
function Si(t, e) {
  var n = t.document.documentElement, r = I(t).on("dragstart.drag", null);
  e && (r.on("click.drag", Q, ut), setTimeout(function() {
    r.on("click.drag", null);
  }, 0)), "onselectstart" in n ? r.on("selectstart.drag", null) : (n.style.MozUserSelect = n.__noselect, delete n.__noselect);
}
const pt = (t) => () => t;
function Wt(t, {
  sourceEvent: e,
  subject: n,
  target: r,
  identifier: i,
  active: a,
  x: o,
  y: s,
  dx: l,
  dy: u,
  dispatch: c
}) {
  Object.defineProperties(this, {
    type: { value: t, enumerable: !0, configurable: !0 },
    sourceEvent: { value: e, enumerable: !0, configurable: !0 },
    subject: { value: n, enumerable: !0, configurable: !0 },
    target: { value: r, enumerable: !0, configurable: !0 },
    identifier: { value: i, enumerable: !0, configurable: !0 },
    active: { value: a, enumerable: !0, configurable: !0 },
    x: { value: o, enumerable: !0, configurable: !0 },
    y: { value: s, enumerable: !0, configurable: !0 },
    dx: { value: l, enumerable: !0, configurable: !0 },
    dy: { value: u, enumerable: !0, configurable: !0 },
    _: { value: c }
  });
}
Wt.prototype.on = function() {
  var t = this._.on.apply(this._, arguments);
  return t === this._ ? this : t;
};
function $i(t) {
  return !t.ctrlKey && !t.button;
}
function Ei() {
  return this.parentNode;
}
function Ci(t, e) {
  return e ?? { x: t.x, y: t.y };
}
function Ti() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function Ri() {
  var t = $i, e = Ei, n = Ci, r = Ti, i = {}, a = It("start", "drag", "end"), o = 0, s, l, u, c, h = 0;
  function f(p) {
    p.on("mousedown.drag", d).filter(r).on("touchstart.drag", M).on("touchmove.drag", C, Ai).on("touchend.drag touchcancel.drag", E).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function d(p, w) {
    if (!(c || !t.call(this, p, w))) {
      var b = N(this, e.call(this, p, w), p, w, "mouse");
      b && (I(p.view).on("mousemove.drag", x, ut).on("mouseup.drag", g, ut), Ni(p.view), qt(p), u = !1, s = p.clientX, l = p.clientY, b("start", p));
    }
  }
  function x(p) {
    if (Q(p), !u) {
      var w = p.clientX - s, b = p.clientY - l;
      u = w * w + b * b > h;
    }
    i.mouse("drag", p);
  }
  function g(p) {
    I(p.view).on("mousemove.drag mouseup.drag", null), Si(p.view, u), Q(p), i.mouse("end", p);
  }
  function M(p, w) {
    if (t.call(this, p, w)) {
      var b = p.changedTouches, v = e.call(this, p, w), A = b.length, S, $;
      for (S = 0; S < A; ++S)
        ($ = N(this, v, p, w, b[S].identifier, b[S])) && (qt(p), $("start", p, b[S]));
    }
  }
  function C(p) {
    var w = p.changedTouches, b = w.length, v, A;
    for (v = 0; v < b; ++v)
      (A = i[w[v].identifier]) && (Q(p), A("drag", p, w[v]));
  }
  function E(p) {
    var w = p.changedTouches, b = w.length, v, A;
    for (c && clearTimeout(c), c = setTimeout(function() {
      c = null;
    }, 500), v = 0; v < b; ++v)
      (A = i[w[v].identifier]) && (qt(p), A("end", p, w[v]));
  }
  function N(p, w, b, v, A, S) {
    var $ = a.copy(), y = ve(S || b, w), m, _, k;
    if ((k = n.call(p, new Wt("beforestart", {
      sourceEvent: b,
      target: f,
      identifier: A,
      active: o,
      x: y[0],
      y: y[1],
      dx: 0,
      dy: 0,
      dispatch: $
    }), v)) != null)
      return m = k.x - y[0] || 0, _ = k.y - y[1] || 0, function T(z, q, R) {
        var F = y, U;
        switch (z) {
          case "start":
            i[A] = T, U = o++;
            break;
          case "end":
            delete i[A], --o;
          case "drag":
            y = ve(R || q, w), U = o;
            break;
        }
        $.call(
          z,
          p,
          new Wt(z, {
            sourceEvent: q,
            subject: k,
            target: f,
            identifier: A,
            active: U,
            x: y[0] + m,
            y: y[1] + _,
            dx: y[0] - F[0],
            dy: y[1] - F[1],
            dispatch: $
          }),
          v
        );
      };
  }
  return f.filter = function(p) {
    return arguments.length ? (t = typeof p == "function" ? p : pt(!!p), f) : t;
  }, f.container = function(p) {
    return arguments.length ? (e = typeof p == "function" ? p : pt(p), f) : e;
  }, f.subject = function(p) {
    return arguments.length ? (n = typeof p == "function" ? p : pt(p), f) : n;
  }, f.touchable = function(p) {
    return arguments.length ? (r = typeof p == "function" ? p : pt(!!p), f) : r;
  }, f.on = function() {
    var p = a.on.apply(a, arguments);
    return p === a ? f : p;
  }, f.clickDistance = function(p) {
    return arguments.length ? (h = (p = +p) * p, f) : Math.sqrt(h);
  }, f;
}
function se(t, e, n) {
  t.prototype = e.prototype = n, n.constructor = t;
}
function en(t, e) {
  var n = Object.create(t.prototype);
  for (var r in e) n[r] = e[r];
  return n;
}
function dt() {
}
var lt = 0.7, Nt = 1 / lt, j = "\\s*([+-]?\\d+)\\s*", ct = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", V = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", Fi = /^#([0-9a-f]{3,8})$/, Pi = new RegExp(`^rgb\\(${j},${j},${j}\\)$`), Ii = new RegExp(`^rgb\\(${V},${V},${V}\\)$`), Oi = new RegExp(`^rgba\\(${j},${j},${j},${ct}\\)$`), zi = new RegExp(`^rgba\\(${V},${V},${V},${ct}\\)$`), Di = new RegExp(`^hsl\\(${ct},${V},${V}\\)$`), Xi = new RegExp(`^hsla\\(${ct},${V},${V},${ct}\\)$`), be = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
se(dt, K, {
  copy(t) {
    return Object.assign(new this.constructor(), this, t);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: ke,
  // Deprecated! Use color.formatHex.
  formatHex: ke,
  formatHex8: Hi,
  formatHsl: qi,
  formatRgb: Me,
  toString: Me
});
function ke() {
  return this.rgb().formatHex();
}
function Hi() {
  return this.rgb().formatHex8();
}
function qi() {
  return nn(this).formatHsl();
}
function Me() {
  return this.rgb().formatRgb();
}
function K(t) {
  var e, n;
  return t = (t + "").trim().toLowerCase(), (e = Fi.exec(t)) ? (n = e[1].length, e = parseInt(e[1], 16), n === 6 ? Ae(e) : n === 3 ? new P(e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, (e & 15) << 4 | e & 15, 1) : n === 8 ? gt(e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, (e & 255) / 255) : n === 4 ? gt(e >> 12 & 15 | e >> 8 & 240, e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, ((e & 15) << 4 | e & 15) / 255) : null) : (e = Pi.exec(t)) ? new P(e[1], e[2], e[3], 1) : (e = Ii.exec(t)) ? new P(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, 1) : (e = Oi.exec(t)) ? gt(e[1], e[2], e[3], e[4]) : (e = zi.exec(t)) ? gt(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, e[4]) : (e = Di.exec(t)) ? $e(e[1], e[2] / 100, e[3] / 100, 1) : (e = Xi.exec(t)) ? $e(e[1], e[2] / 100, e[3] / 100, e[4]) : be.hasOwnProperty(t) ? Ae(be[t]) : t === "transparent" ? new P(NaN, NaN, NaN, 0) : null;
}
function Ae(t) {
  return new P(t >> 16 & 255, t >> 8 & 255, t & 255, 1);
}
function gt(t, e, n, r) {
  return r <= 0 && (t = e = n = NaN), new P(t, e, n, r);
}
function Vi(t) {
  return t instanceof dt || (t = K(t)), t ? (t = t.rgb(), new P(t.r, t.g, t.b, t.opacity)) : new P();
}
function Kt(t, e, n, r) {
  return arguments.length === 1 ? Vi(t) : new P(t, e, n, r ?? 1);
}
function P(t, e, n, r) {
  this.r = +t, this.g = +e, this.b = +n, this.opacity = +r;
}
se(P, Kt, en(dt, {
  brighter(t) {
    return t = t == null ? Nt : Math.pow(Nt, t), new P(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? lt : Math.pow(lt, t), new P(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new P(W(this.r), W(this.g), W(this.b), St(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: Ne,
  // Deprecated! Use color.formatHex.
  formatHex: Ne,
  formatHex8: Li,
  formatRgb: Se,
  toString: Se
}));
function Ne() {
  return `#${G(this.r)}${G(this.g)}${G(this.b)}`;
}
function Li() {
  return `#${G(this.r)}${G(this.g)}${G(this.b)}${G((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function Se() {
  const t = St(this.opacity);
  return `${t === 1 ? "rgb(" : "rgba("}${W(this.r)}, ${W(this.g)}, ${W(this.b)}${t === 1 ? ")" : `, ${t})`}`;
}
function St(t) {
  return isNaN(t) ? 1 : Math.max(0, Math.min(1, t));
}
function W(t) {
  return Math.max(0, Math.min(255, Math.round(t) || 0));
}
function G(t) {
  return t = W(t), (t < 16 ? "0" : "") + t.toString(16);
}
function $e(t, e, n, r) {
  return r <= 0 ? t = e = n = NaN : n <= 0 || n >= 1 ? t = e = NaN : e <= 0 && (t = NaN), new X(t, e, n, r);
}
function nn(t) {
  if (t instanceof X) return new X(t.h, t.s, t.l, t.opacity);
  if (t instanceof dt || (t = K(t)), !t) return new X();
  if (t instanceof X) return t;
  t = t.rgb();
  var e = t.r / 255, n = t.g / 255, r = t.b / 255, i = Math.min(e, n, r), a = Math.max(e, n, r), o = NaN, s = a - i, l = (a + i) / 2;
  return s ? (e === a ? o = (n - r) / s + (n < r) * 6 : n === a ? o = (r - e) / s + 2 : o = (e - n) / s + 4, s /= l < 0.5 ? a + i : 2 - a - i, o *= 60) : s = l > 0 && l < 1 ? 0 : o, new X(o, s, l, t.opacity);
}
function Yi(t, e, n, r) {
  return arguments.length === 1 ? nn(t) : new X(t, e, n, r ?? 1);
}
function X(t, e, n, r) {
  this.h = +t, this.s = +e, this.l = +n, this.opacity = +r;
}
se(X, Yi, en(dt, {
  brighter(t) {
    return t = t == null ? Nt : Math.pow(Nt, t), new X(this.h, this.s, this.l * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? lt : Math.pow(lt, t), new X(this.h, this.s, this.l * t, this.opacity);
  },
  rgb() {
    var t = this.h % 360 + (this.h < 0) * 360, e = isNaN(t) || isNaN(this.s) ? 0 : this.s, n = this.l, r = n + (n < 0.5 ? n : 1 - n) * e, i = 2 * n - r;
    return new P(
      Vt(t >= 240 ? t - 240 : t + 120, i, r),
      Vt(t, i, r),
      Vt(t < 120 ? t + 240 : t - 120, i, r),
      this.opacity
    );
  },
  clamp() {
    return new X(Ee(this.h), mt(this.s), mt(this.l), St(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const t = St(this.opacity);
    return `${t === 1 ? "hsl(" : "hsla("}${Ee(this.h)}, ${mt(this.s) * 100}%, ${mt(this.l) * 100}%${t === 1 ? ")" : `, ${t})`}`;
  }
}));
function Ee(t) {
  return t = (t || 0) % 360, t < 0 ? t + 360 : t;
}
function mt(t) {
  return Math.max(0, Math.min(1, t || 0));
}
function Vt(t, e, n) {
  return (t < 60 ? e + (n - e) * t / 60 : t < 180 ? n : t < 240 ? e + (n - e) * (240 - t) / 60 : e) * 255;
}
const ue = (t) => () => t;
function Bi(t, e) {
  return function(n) {
    return t + n * e;
  };
}
function Ui(t, e, n) {
  return t = Math.pow(t, n), e = Math.pow(e, n) - t, n = 1 / n, function(r) {
    return Math.pow(t + r * e, n);
  };
}
function Gi(t) {
  return (t = +t) == 1 ? rn : function(e, n) {
    return n - e ? Ui(e, n, t) : ue(isNaN(e) ? n : e);
  };
}
function rn(t, e) {
  var n = e - t;
  return n ? Bi(t, n) : ue(isNaN(t) ? e : t);
}
const $t = function t(e) {
  var n = Gi(e);
  function r(i, a) {
    var o = n((i = Kt(i)).r, (a = Kt(a)).r), s = n(i.g, a.g), l = n(i.b, a.b), u = rn(i.opacity, a.opacity);
    return function(c) {
      return i.r = o(c), i.g = s(c), i.b = l(c), i.opacity = u(c), i + "";
    };
  }
  return r.gamma = t, r;
}(1);
function Wi(t, e) {
  e || (e = []);
  var n = t ? Math.min(e.length, t.length) : 0, r = e.slice(), i;
  return function(a) {
    for (i = 0; i < n; ++i) r[i] = t[i] * (1 - a) + e[i] * a;
    return r;
  };
}
function Ki(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function Zi(t, e) {
  var n = e ? e.length : 0, r = t ? Math.min(n, t.length) : 0, i = new Array(r), a = new Array(n), o;
  for (o = 0; o < r; ++o) i[o] = le(t[o], e[o]);
  for (; o < n; ++o) a[o] = e[o];
  return function(s) {
    for (o = 0; o < r; ++o) a[o] = i[o](s);
    return a;
  };
}
function Ji(t, e) {
  var n = /* @__PURE__ */ new Date();
  return t = +t, e = +e, function(r) {
    return n.setTime(t * (1 - r) + e * r), n;
  };
}
function D(t, e) {
  return t = +t, e = +e, function(n) {
    return t * (1 - n) + e * n;
  };
}
function Qi(t, e) {
  var n = {}, r = {}, i;
  (t === null || typeof t != "object") && (t = {}), (e === null || typeof e != "object") && (e = {});
  for (i in e)
    i in t ? n[i] = le(t[i], e[i]) : r[i] = e[i];
  return function(a) {
    for (i in n) r[i] = n[i](a);
    return r;
  };
}
var Zt = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, Lt = new RegExp(Zt.source, "g");
function ji(t) {
  return function() {
    return t;
  };
}
function ta(t) {
  return function(e) {
    return t(e) + "";
  };
}
function an(t, e) {
  var n = Zt.lastIndex = Lt.lastIndex = 0, r, i, a, o = -1, s = [], l = [];
  for (t = t + "", e = e + ""; (r = Zt.exec(t)) && (i = Lt.exec(e)); )
    (a = i.index) > n && (a = e.slice(n, a), s[o] ? s[o] += a : s[++o] = a), (r = r[0]) === (i = i[0]) ? s[o] ? s[o] += i : s[++o] = i : (s[++o] = null, l.push({ i: o, x: D(r, i) })), n = Lt.lastIndex;
  return n < e.length && (a = e.slice(n), s[o] ? s[o] += a : s[++o] = a), s.length < 2 ? l[0] ? ta(l[0].x) : ji(e) : (e = l.length, function(u) {
    for (var c = 0, h; c < e; ++c) s[(h = l[c]).i] = h.x(u);
    return s.join("");
  });
}
function le(t, e) {
  var n = typeof e, r;
  return e == null || n === "boolean" ? ue(e) : (n === "number" ? D : n === "string" ? (r = K(e)) ? (e = r, $t) : an : e instanceof K ? $t : e instanceof Date ? Ji : Ki(e) ? Wi : Array.isArray(e) ? Zi : typeof e.valueOf != "function" && typeof e.toString != "function" || isNaN(e) ? Qi : D)(t, e);
}
function ea(t, e) {
  return t = +t, e = +e, function(n) {
    return Math.round(t * (1 - n) + e * n);
  };
}
var Ce = 180 / Math.PI, Jt = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function on(t, e, n, r, i, a) {
  var o, s, l;
  return (o = Math.sqrt(t * t + e * e)) && (t /= o, e /= o), (l = t * n + e * r) && (n -= t * l, r -= e * l), (s = Math.sqrt(n * n + r * r)) && (n /= s, r /= s, l /= s), t * r < e * n && (t = -t, e = -e, l = -l, o = -o), {
    translateX: i,
    translateY: a,
    rotate: Math.atan2(e, t) * Ce,
    skewX: Math.atan(l) * Ce,
    scaleX: o,
    scaleY: s
  };
}
var yt;
function na(t) {
  const e = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(t + "");
  return e.isIdentity ? Jt : on(e.a, e.b, e.c, e.d, e.e, e.f);
}
function ra(t) {
  return t == null || (yt || (yt = document.createElementNS("http://www.w3.org/2000/svg", "g")), yt.setAttribute("transform", t), !(t = yt.transform.baseVal.consolidate())) ? Jt : (t = t.matrix, on(t.a, t.b, t.c, t.d, t.e, t.f));
}
function sn(t, e, n, r) {
  function i(u) {
    return u.length ? u.pop() + " " : "";
  }
  function a(u, c, h, f, d, x) {
    if (u !== h || c !== f) {
      var g = d.push("translate(", null, e, null, n);
      x.push({ i: g - 4, x: D(u, h) }, { i: g - 2, x: D(c, f) });
    } else (h || f) && d.push("translate(" + h + e + f + n);
  }
  function o(u, c, h, f) {
    u !== c ? (u - c > 180 ? c += 360 : c - u > 180 && (u += 360), f.push({ i: h.push(i(h) + "rotate(", null, r) - 2, x: D(u, c) })) : c && h.push(i(h) + "rotate(" + c + r);
  }
  function s(u, c, h, f) {
    u !== c ? f.push({ i: h.push(i(h) + "skewX(", null, r) - 2, x: D(u, c) }) : c && h.push(i(h) + "skewX(" + c + r);
  }
  function l(u, c, h, f, d, x) {
    if (u !== h || c !== f) {
      var g = d.push(i(d) + "scale(", null, ",", null, ")");
      x.push({ i: g - 4, x: D(u, h) }, { i: g - 2, x: D(c, f) });
    } else (h !== 1 || f !== 1) && d.push(i(d) + "scale(" + h + "," + f + ")");
  }
  return function(u, c) {
    var h = [], f = [];
    return u = t(u), c = t(c), a(u.translateX, u.translateY, c.translateX, c.translateY, h, f), o(u.rotate, c.rotate, h, f), s(u.skewX, c.skewX, h, f), l(u.scaleX, u.scaleY, c.scaleX, c.scaleY, h, f), u = c = null, function(d) {
      for (var x = -1, g = f.length, M; ++x < g; ) h[(M = f[x]).i] = M.x(d);
      return h.join("");
    };
  };
}
var ia = sn(na, "px, ", "px)", "deg)"), aa = sn(ra, ", ", ")", ")"), et = 0, at = 0, rt = 0, un = 1e3, Et, ot, Ct = 0, Z = 0, zt = 0, ft = typeof performance == "object" && performance.now ? performance : Date, ln = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(t) {
  setTimeout(t, 17);
};
function ce() {
  return Z || (ln(oa), Z = ft.now() + zt);
}
function oa() {
  Z = 0;
}
function Tt() {
  this._call = this._time = this._next = null;
}
Tt.prototype = cn.prototype = {
  constructor: Tt,
  restart: function(t, e, n) {
    if (typeof t != "function") throw new TypeError("callback is not a function");
    n = (n == null ? ce() : +n) + (e == null ? 0 : +e), !this._next && ot !== this && (ot ? ot._next = this : Et = this, ot = this), this._call = t, this._time = n, Qt();
  },
  stop: function() {
    this._call && (this._call = null, this._time = 1 / 0, Qt());
  }
};
function cn(t, e, n) {
  var r = new Tt();
  return r.restart(t, e, n), r;
}
function sa() {
  ce(), ++et;
  for (var t = Et, e; t; )
    (e = Z - t._time) >= 0 && t._call.call(void 0, e), t = t._next;
  --et;
}
function Te() {
  Z = (Ct = ft.now()) + zt, et = at = 0;
  try {
    sa();
  } finally {
    et = 0, la(), Z = 0;
  }
}
function ua() {
  var t = ft.now(), e = t - Ct;
  e > un && (zt -= e, Ct = t);
}
function la() {
  for (var t, e = Et, n, r = 1 / 0; e; )
    e._call ? (r > e._time && (r = e._time), t = e, e = e._next) : (n = e._next, e._next = null, e = t ? t._next = n : Et = n);
  ot = t, Qt(r);
}
function Qt(t) {
  if (!et) {
    at && (at = clearTimeout(at));
    var e = t - Z;
    e > 24 ? (t < 1 / 0 && (at = setTimeout(Te, t - ft.now() - zt)), rt && (rt = clearInterval(rt))) : (rt || (Ct = ft.now(), rt = setInterval(ua, un)), et = 1, ln(Te));
  }
}
function Re(t, e, n) {
  var r = new Tt();
  return e = e == null ? 0 : +e, r.restart((i) => {
    r.stop(), t(i + e);
  }, e, n), r;
}
var ca = It("start", "end", "cancel", "interrupt"), fa = [], fn = 0, Fe = 1, jt = 2, vt = 3, Pe = 4, te = 5, bt = 6;
function Dt(t, e, n, r, i, a) {
  var o = t.__transition;
  if (!o) t.__transition = {};
  else if (n in o) return;
  ha(t, n, {
    name: e,
    index: r,
    // For context during callback.
    group: i,
    // For context during callback.
    on: ca,
    tween: fa,
    time: a.time,
    delay: a.delay,
    duration: a.duration,
    ease: a.ease,
    timer: null,
    state: fn
  });
}
function fe(t, e) {
  var n = H(t, e);
  if (n.state > fn) throw new Error("too late; already scheduled");
  return n;
}
function L(t, e) {
  var n = H(t, e);
  if (n.state > vt) throw new Error("too late; already running");
  return n;
}
function H(t, e) {
  var n = t.__transition;
  if (!n || !(n = n[e])) throw new Error("transition not found");
  return n;
}
function ha(t, e, n) {
  var r = t.__transition, i;
  r[e] = n, n.timer = cn(a, 0, n.time);
  function a(u) {
    n.state = Fe, n.timer.restart(o, n.delay, n.time), n.delay <= u && o(u - n.delay);
  }
  function o(u) {
    var c, h, f, d;
    if (n.state !== Fe) return l();
    for (c in r)
      if (d = r[c], d.name === n.name) {
        if (d.state === vt) return Re(o);
        d.state === Pe ? (d.state = bt, d.timer.stop(), d.on.call("interrupt", t, t.__data__, d.index, d.group), delete r[c]) : +c < e && (d.state = bt, d.timer.stop(), d.on.call("cancel", t, t.__data__, d.index, d.group), delete r[c]);
      }
    if (Re(function() {
      n.state === vt && (n.state = Pe, n.timer.restart(s, n.delay, n.time), s(u));
    }), n.state = jt, n.on.call("start", t, t.__data__, n.index, n.group), n.state === jt) {
      for (n.state = vt, i = new Array(f = n.tween.length), c = 0, h = -1; c < f; ++c)
        (d = n.tween[c].value.call(t, t.__data__, n.index, n.group)) && (i[++h] = d);
      i.length = h + 1;
    }
  }
  function s(u) {
    for (var c = u < n.duration ? n.ease.call(null, u / n.duration) : (n.timer.restart(l), n.state = te, 1), h = -1, f = i.length; ++h < f; )
      i[h].call(t, c);
    n.state === te && (n.on.call("end", t, t.__data__, n.index, n.group), l());
  }
  function l() {
    n.state = bt, n.timer.stop(), delete r[e];
    for (var u in r) return;
    delete t.__transition;
  }
}
function da(t, e) {
  var n = t.__transition, r, i, a = !0, o;
  if (n) {
    e = e == null ? null : e + "";
    for (o in n) {
      if ((r = n[o]).name !== e) {
        a = !1;
        continue;
      }
      i = r.state > jt && r.state < te, r.state = bt, r.timer.stop(), r.on.call(i ? "interrupt" : "cancel", t, t.__data__, r.index, r.group), delete n[o];
    }
    a && delete t.__transition;
  }
}
function pa(t) {
  return this.each(function() {
    da(this, t);
  });
}
function ga(t, e) {
  var n, r;
  return function() {
    var i = L(this, t), a = i.tween;
    if (a !== n) {
      r = n = a;
      for (var o = 0, s = r.length; o < s; ++o)
        if (r[o].name === e) {
          r = r.slice(), r.splice(o, 1);
          break;
        }
    }
    i.tween = r;
  };
}
function ma(t, e, n) {
  var r, i;
  if (typeof n != "function") throw new Error();
  return function() {
    var a = L(this, t), o = a.tween;
    if (o !== r) {
      i = (r = o).slice();
      for (var s = { name: e, value: n }, l = 0, u = i.length; l < u; ++l)
        if (i[l].name === e) {
          i[l] = s;
          break;
        }
      l === u && i.push(s);
    }
    a.tween = i;
  };
}
function ya(t, e) {
  var n = this._id;
  if (t += "", arguments.length < 2) {
    for (var r = H(this.node(), n).tween, i = 0, a = r.length, o; i < a; ++i)
      if ((o = r[i]).name === t)
        return o.value;
    return null;
  }
  return this.each((e == null ? ga : ma)(n, t, e));
}
function he(t, e, n) {
  var r = t._id;
  return t.each(function() {
    var i = L(this, r);
    (i.value || (i.value = {}))[e] = n.apply(this, arguments);
  }), function(i) {
    return H(i, r).value[e];
  };
}
function hn(t, e) {
  var n;
  return (typeof e == "number" ? D : e instanceof K ? $t : (n = K(e)) ? (e = n, $t) : an)(t, e);
}
function xa(t) {
  return function() {
    this.removeAttribute(t);
  };
}
function wa(t) {
  return function() {
    this.removeAttributeNS(t.space, t.local);
  };
}
function _a(t, e, n) {
  var r, i = n + "", a;
  return function() {
    var o = this.getAttribute(t);
    return o === i ? null : o === r ? a : a = e(r = o, n);
  };
}
function va(t, e, n) {
  var r, i = n + "", a;
  return function() {
    var o = this.getAttributeNS(t.space, t.local);
    return o === i ? null : o === r ? a : a = e(r = o, n);
  };
}
function ba(t, e, n) {
  var r, i, a;
  return function() {
    var o, s = n(this), l;
    return s == null ? void this.removeAttribute(t) : (o = this.getAttribute(t), l = s + "", o === l ? null : o === r && l === i ? a : (i = l, a = e(r = o, s)));
  };
}
function ka(t, e, n) {
  var r, i, a;
  return function() {
    var o, s = n(this), l;
    return s == null ? void this.removeAttributeNS(t.space, t.local) : (o = this.getAttributeNS(t.space, t.local), l = s + "", o === l ? null : o === r && l === i ? a : (i = l, a = e(r = o, s)));
  };
}
function Ma(t, e) {
  var n = Ot(t), r = n === "transform" ? aa : hn;
  return this.attrTween(t, typeof e == "function" ? (n.local ? ka : ba)(n, r, he(this, "attr." + t, e)) : e == null ? (n.local ? wa : xa)(n) : (n.local ? va : _a)(n, r, e));
}
function Aa(t, e) {
  return function(n) {
    this.setAttribute(t, e.call(this, n));
  };
}
function Na(t, e) {
  return function(n) {
    this.setAttributeNS(t.space, t.local, e.call(this, n));
  };
}
function Sa(t, e) {
  var n, r;
  function i() {
    var a = e.apply(this, arguments);
    return a !== r && (n = (r = a) && Na(t, a)), n;
  }
  return i._value = e, i;
}
function $a(t, e) {
  var n, r;
  function i() {
    var a = e.apply(this, arguments);
    return a !== r && (n = (r = a) && Aa(t, a)), n;
  }
  return i._value = e, i;
}
function Ea(t, e) {
  var n = "attr." + t;
  if (arguments.length < 2) return (n = this.tween(n)) && n._value;
  if (e == null) return this.tween(n, null);
  if (typeof e != "function") throw new Error();
  var r = Ot(t);
  return this.tween(n, (r.local ? Sa : $a)(r, e));
}
function Ca(t, e) {
  return function() {
    fe(this, t).delay = +e.apply(this, arguments);
  };
}
function Ta(t, e) {
  return e = +e, function() {
    fe(this, t).delay = e;
  };
}
function Ra(t) {
  var e = this._id;
  return arguments.length ? this.each((typeof t == "function" ? Ca : Ta)(e, t)) : H(this.node(), e).delay;
}
function Fa(t, e) {
  return function() {
    L(this, t).duration = +e.apply(this, arguments);
  };
}
function Pa(t, e) {
  return e = +e, function() {
    L(this, t).duration = e;
  };
}
function Ia(t) {
  var e = this._id;
  return arguments.length ? this.each((typeof t == "function" ? Fa : Pa)(e, t)) : H(this.node(), e).duration;
}
function Oa(t, e) {
  if (typeof e != "function") throw new Error();
  return function() {
    L(this, t).ease = e;
  };
}
function za(t) {
  var e = this._id;
  return arguments.length ? this.each(Oa(e, t)) : H(this.node(), e).ease;
}
function Da(t, e) {
  return function() {
    var n = e.apply(this, arguments);
    if (typeof n != "function") throw new Error();
    L(this, t).ease = n;
  };
}
function Xa(t) {
  if (typeof t != "function") throw new Error();
  return this.each(Da(this._id, t));
}
function Ha(t) {
  typeof t != "function" && (t = Be(t));
  for (var e = this._groups, n = e.length, r = new Array(n), i = 0; i < n; ++i)
    for (var a = e[i], o = a.length, s = r[i] = [], l, u = 0; u < o; ++u)
      (l = a[u]) && t.call(l, l.__data__, u, a) && s.push(l);
  return new B(r, this._parents, this._name, this._id);
}
function qa(t) {
  if (t._id !== this._id) throw new Error();
  for (var e = this._groups, n = t._groups, r = e.length, i = n.length, a = Math.min(r, i), o = new Array(r), s = 0; s < a; ++s)
    for (var l = e[s], u = n[s], c = l.length, h = o[s] = new Array(c), f, d = 0; d < c; ++d)
      (f = l[d] || u[d]) && (h[d] = f);
  for (; s < r; ++s)
    o[s] = e[s];
  return new B(o, this._parents, this._name, this._id);
}
function Va(t) {
  return (t + "").trim().split(/^|\s+/).every(function(e) {
    var n = e.indexOf(".");
    return n >= 0 && (e = e.slice(0, n)), !e || e === "start";
  });
}
function La(t, e, n) {
  var r, i, a = Va(e) ? fe : L;
  return function() {
    var o = a(this, t), s = o.on;
    s !== r && (i = (r = s).copy()).on(e, n), o.on = i;
  };
}
function Ya(t, e) {
  var n = this._id;
  return arguments.length < 2 ? H(this.node(), n).on.on(t) : this.each(La(n, t, e));
}
function Ba(t) {
  return function() {
    var e = this.parentNode;
    for (var n in this.__transition) if (+n !== t) return;
    e && e.removeChild(this);
  };
}
function Ua() {
  return this.on("end.remove", Ba(this._id));
}
function Ga(t) {
  var e = this._name, n = this._id;
  typeof t != "function" && (t = ie(t));
  for (var r = this._groups, i = r.length, a = new Array(i), o = 0; o < i; ++o)
    for (var s = r[o], l = s.length, u = a[o] = new Array(l), c, h, f = 0; f < l; ++f)
      (c = s[f]) && (h = t.call(c, c.__data__, f, s)) && ("__data__" in c && (h.__data__ = c.__data__), u[f] = h, Dt(u[f], e, n, f, u, H(c, n)));
  return new B(a, this._parents, e, n);
}
function Wa(t) {
  var e = this._name, n = this._id;
  typeof t != "function" && (t = Ye(t));
  for (var r = this._groups, i = r.length, a = [], o = [], s = 0; s < i; ++s)
    for (var l = r[s], u = l.length, c, h = 0; h < u; ++h)
      if (c = l[h]) {
        for (var f = t.call(c, c.__data__, h, l), d, x = H(c, n), g = 0, M = f.length; g < M; ++g)
          (d = f[g]) && Dt(d, e, n, g, f, x);
        a.push(f), o.push(c);
      }
  return new B(a, o, e, n);
}
var Ka = ht.prototype.constructor;
function Za() {
  return new Ka(this._groups, this._parents);
}
function Ja(t, e) {
  var n, r, i;
  return function() {
    var a = tt(this, t), o = (this.style.removeProperty(t), tt(this, t));
    return a === o ? null : a === n && o === r ? i : i = e(n = a, r = o);
  };
}
function dn(t) {
  return function() {
    this.style.removeProperty(t);
  };
}
function Qa(t, e, n) {
  var r, i = n + "", a;
  return function() {
    var o = tt(this, t);
    return o === i ? null : o === r ? a : a = e(r = o, n);
  };
}
function ja(t, e, n) {
  var r, i, a;
  return function() {
    var o = tt(this, t), s = n(this), l = s + "";
    return s == null && (l = s = (this.style.removeProperty(t), tt(this, t))), o === l ? null : o === r && l === i ? a : (i = l, a = e(r = o, s));
  };
}
function to(t, e) {
  var n, r, i, a = "style." + e, o = "end." + a, s;
  return function() {
    var l = L(this, t), u = l.on, c = l.value[a] == null ? s || (s = dn(e)) : void 0;
    (u !== n || i !== c) && (r = (n = u).copy()).on(o, i = c), l.on = r;
  };
}
function eo(t, e, n) {
  var r = (t += "") == "transform" ? ia : hn;
  return e == null ? this.styleTween(t, Ja(t, r)).on("end.style." + t, dn(t)) : typeof e == "function" ? this.styleTween(t, ja(t, r, he(this, "style." + t, e))).each(to(this._id, t)) : this.styleTween(t, Qa(t, r, e), n).on("end.style." + t, null);
}
function no(t, e, n) {
  return function(r) {
    this.style.setProperty(t, e.call(this, r), n);
  };
}
function ro(t, e, n) {
  var r, i;
  function a() {
    var o = e.apply(this, arguments);
    return o !== i && (r = (i = o) && no(t, o, n)), r;
  }
  return a._value = e, a;
}
function io(t, e, n) {
  var r = "style." + (t += "");
  if (arguments.length < 2) return (r = this.tween(r)) && r._value;
  if (e == null) return this.tween(r, null);
  if (typeof e != "function") throw new Error();
  return this.tween(r, ro(t, e, n ?? ""));
}
function ao(t) {
  return function() {
    this.textContent = t;
  };
}
function oo(t) {
  return function() {
    var e = t(this);
    this.textContent = e ?? "";
  };
}
function so(t) {
  return this.tween("text", typeof t == "function" ? oo(he(this, "text", t)) : ao(t == null ? "" : t + ""));
}
function uo(t) {
  return function(e) {
    this.textContent = t.call(this, e);
  };
}
function lo(t) {
  var e, n;
  function r() {
    var i = t.apply(this, arguments);
    return i !== n && (e = (n = i) && uo(i)), e;
  }
  return r._value = t, r;
}
function co(t) {
  var e = "text";
  if (arguments.length < 1) return (e = this.tween(e)) && e._value;
  if (t == null) return this.tween(e, null);
  if (typeof t != "function") throw new Error();
  return this.tween(e, lo(t));
}
function fo() {
  for (var t = this._name, e = this._id, n = pn(), r = this._groups, i = r.length, a = 0; a < i; ++a)
    for (var o = r[a], s = o.length, l, u = 0; u < s; ++u)
      if (l = o[u]) {
        var c = H(l, e);
        Dt(l, t, n, u, o, {
          time: c.time + c.delay + c.duration,
          delay: 0,
          duration: c.duration,
          ease: c.ease
        });
      }
  return new B(r, this._parents, t, n);
}
function ho() {
  var t, e, n = this, r = n._id, i = n.size();
  return new Promise(function(a, o) {
    var s = { value: o }, l = { value: function() {
      --i === 0 && a();
    } };
    n.each(function() {
      var u = L(this, r), c = u.on;
      c !== t && (e = (t = c).copy(), e._.cancel.push(s), e._.interrupt.push(s), e._.end.push(l)), u.on = e;
    }), i === 0 && a();
  });
}
var po = 0;
function B(t, e, n, r) {
  this._groups = t, this._parents = e, this._name = n, this._id = r;
}
function pn() {
  return ++po;
}
var Y = ht.prototype;
B.prototype = {
  constructor: B,
  select: Ga,
  selectAll: Wa,
  selectChild: Y.selectChild,
  selectChildren: Y.selectChildren,
  filter: Ha,
  merge: qa,
  selection: Za,
  transition: fo,
  call: Y.call,
  nodes: Y.nodes,
  node: Y.node,
  size: Y.size,
  empty: Y.empty,
  each: Y.each,
  on: Ya,
  attr: Ma,
  attrTween: Ea,
  style: eo,
  styleTween: io,
  text: so,
  textTween: co,
  remove: Ua,
  tween: ya,
  delay: Ra,
  duration: Ia,
  ease: za,
  easeVarying: Xa,
  end: ho,
  [Symbol.iterator]: Y[Symbol.iterator]
};
function go(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
var mo = {
  time: null,
  // Set on use.
  delay: 0,
  duration: 250,
  ease: go
};
function yo(t, e) {
  for (var n; !(n = t.__transition) || !(n = n[e]); )
    if (!(t = t.parentNode))
      throw new Error(`transition ${e} not found`);
  return n;
}
function xo(t) {
  var e, n;
  t instanceof B ? (e = t._id, t = t._name) : (e = pn(), (n = mo).time = ce(), t = t == null ? null : t + "");
  for (var r = this._groups, i = r.length, a = 0; a < i; ++a)
    for (var o = r[a], s = o.length, l, u = 0; u < s; ++u)
      (l = o[u]) && Dt(l, t, e, u, o, n || yo(l, e));
  return new B(r, this._parents, t, e);
}
ht.prototype.interrupt = pa;
ht.prototype.transition = xo;
function wo(t) {
  return Math.abs(t = Math.round(t)) >= 1e21 ? t.toLocaleString("en").replace(/,/g, "") : t.toString(10);
}
function Rt(t, e) {
  if ((n = (t = e ? t.toExponential(e - 1) : t.toExponential()).indexOf("e")) < 0) return null;
  var n, r = t.slice(0, n);
  return [
    r.length > 1 ? r[0] + r.slice(2) : r,
    +t.slice(n + 1)
  ];
}
function nt(t) {
  return t = Rt(Math.abs(t)), t ? t[1] : NaN;
}
function _o(t, e) {
  return function(n, r) {
    for (var i = n.length, a = [], o = 0, s = t[0], l = 0; i > 0 && s > 0 && (l + s + 1 > r && (s = Math.max(1, r - l)), a.push(n.substring(i -= s, i + s)), !((l += s + 1) > r)); )
      s = t[o = (o + 1) % t.length];
    return a.reverse().join(e);
  };
}
function vo(t) {
  return function(e) {
    return e.replace(/[0-9]/g, function(n) {
      return t[+n];
    });
  };
}
var bo = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function Ft(t) {
  if (!(e = bo.exec(t))) throw new Error("invalid format: " + t);
  var e;
  return new de({
    fill: e[1],
    align: e[2],
    sign: e[3],
    symbol: e[4],
    zero: e[5],
    width: e[6],
    comma: e[7],
    precision: e[8] && e[8].slice(1),
    trim: e[9],
    type: e[10]
  });
}
Ft.prototype = de.prototype;
function de(t) {
  this.fill = t.fill === void 0 ? " " : t.fill + "", this.align = t.align === void 0 ? ">" : t.align + "", this.sign = t.sign === void 0 ? "-" : t.sign + "", this.symbol = t.symbol === void 0 ? "" : t.symbol + "", this.zero = !!t.zero, this.width = t.width === void 0 ? void 0 : +t.width, this.comma = !!t.comma, this.precision = t.precision === void 0 ? void 0 : +t.precision, this.trim = !!t.trim, this.type = t.type === void 0 ? "" : t.type + "";
}
de.prototype.toString = function() {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};
function ko(t) {
  t: for (var e = t.length, n = 1, r = -1, i; n < e; ++n)
    switch (t[n]) {
      case ".":
        r = i = n;
        break;
      case "0":
        r === 0 && (r = n), i = n;
        break;
      default:
        if (!+t[n]) break t;
        r > 0 && (r = 0);
        break;
    }
  return r > 0 ? t.slice(0, r) + t.slice(i + 1) : t;
}
var gn;
function Mo(t, e) {
  var n = Rt(t, e);
  if (!n) return t + "";
  var r = n[0], i = n[1], a = i - (gn = Math.max(-8, Math.min(8, Math.floor(i / 3))) * 3) + 1, o = r.length;
  return a === o ? r : a > o ? r + new Array(a - o + 1).join("0") : a > 0 ? r.slice(0, a) + "." + r.slice(a) : "0." + new Array(1 - a).join("0") + Rt(t, Math.max(0, e + a - 1))[0];
}
function Ie(t, e) {
  var n = Rt(t, e);
  if (!n) return t + "";
  var r = n[0], i = n[1];
  return i < 0 ? "0." + new Array(-i).join("0") + r : r.length > i + 1 ? r.slice(0, i + 1) + "." + r.slice(i + 1) : r + new Array(i - r.length + 2).join("0");
}
const Oe = {
  "%": (t, e) => (t * 100).toFixed(e),
  b: (t) => Math.round(t).toString(2),
  c: (t) => t + "",
  d: wo,
  e: (t, e) => t.toExponential(e),
  f: (t, e) => t.toFixed(e),
  g: (t, e) => t.toPrecision(e),
  o: (t) => Math.round(t).toString(8),
  p: (t, e) => Ie(t * 100, e),
  r: Ie,
  s: Mo,
  X: (t) => Math.round(t).toString(16).toUpperCase(),
  x: (t) => Math.round(t).toString(16)
};
function ze(t) {
  return t;
}
var De = Array.prototype.map, Xe = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function Ao(t) {
  var e = t.grouping === void 0 || t.thousands === void 0 ? ze : _o(De.call(t.grouping, Number), t.thousands + ""), n = t.currency === void 0 ? "" : t.currency[0] + "", r = t.currency === void 0 ? "" : t.currency[1] + "", i = t.decimal === void 0 ? "." : t.decimal + "", a = t.numerals === void 0 ? ze : vo(De.call(t.numerals, String)), o = t.percent === void 0 ? "%" : t.percent + "", s = t.minus === void 0 ? "−" : t.minus + "", l = t.nan === void 0 ? "NaN" : t.nan + "";
  function u(h) {
    h = Ft(h);
    var f = h.fill, d = h.align, x = h.sign, g = h.symbol, M = h.zero, C = h.width, E = h.comma, N = h.precision, p = h.trim, w = h.type;
    w === "n" ? (E = !0, w = "g") : Oe[w] || (N === void 0 && (N = 12), p = !0, w = "g"), (M || f === "0" && d === "=") && (M = !0, f = "0", d = "=");
    var b = g === "$" ? n : g === "#" && /[boxX]/.test(w) ? "0" + w.toLowerCase() : "", v = g === "$" ? r : /[%p]/.test(w) ? o : "", A = Oe[w], S = /[defgprs%]/.test(w);
    N = N === void 0 ? 6 : /[gprs]/.test(w) ? Math.max(1, Math.min(21, N)) : Math.max(0, Math.min(20, N));
    function $(y) {
      var m = b, _ = v, k, T, z;
      if (w === "c")
        _ = A(y) + _, y = "";
      else {
        y = +y;
        var q = y < 0 || 1 / y < 0;
        if (y = isNaN(y) ? l : A(Math.abs(y), N), p && (y = ko(y)), q && +y == 0 && x !== "+" && (q = !1), m = (q ? x === "(" ? x : s : x === "-" || x === "(" ? "" : x) + m, _ = (w === "s" ? Xe[8 + gn / 3] : "") + _ + (q && x === "(" ? ")" : ""), S) {
          for (k = -1, T = y.length; ++k < T; )
            if (z = y.charCodeAt(k), 48 > z || z > 57) {
              _ = (z === 46 ? i + y.slice(k + 1) : y.slice(k)) + _, y = y.slice(0, k);
              break;
            }
        }
      }
      E && !M && (y = e(y, 1 / 0));
      var R = m.length + y.length + _.length, F = R < C ? new Array(C - R + 1).join(f) : "";
      switch (E && M && (y = e(F + y, F.length ? C - _.length : 1 / 0), F = ""), d) {
        case "<":
          y = m + y + _ + F;
          break;
        case "=":
          y = m + F + y + _;
          break;
        case "^":
          y = F.slice(0, R = F.length >> 1) + m + y + _ + F.slice(R);
          break;
        default:
          y = F + m + y + _;
          break;
      }
      return a(y);
    }
    return $.toString = function() {
      return h + "";
    }, $;
  }
  function c(h, f) {
    var d = u((h = Ft(h), h.type = "f", h)), x = Math.max(-8, Math.min(8, Math.floor(nt(f) / 3))) * 3, g = Math.pow(10, -x), M = Xe[8 + x / 3];
    return function(C) {
      return d(g * C) + M;
    };
  }
  return {
    format: u,
    formatPrefix: c
  };
}
var xt, mn, yn;
No({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
function No(t) {
  return xt = Ao(t), mn = xt.format, yn = xt.formatPrefix, xt;
}
function So(t) {
  return Math.max(0, -nt(Math.abs(t)));
}
function $o(t, e) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(nt(e) / 3))) * 3 - nt(Math.abs(t)));
}
function Eo(t, e) {
  return t = Math.abs(t), e = Math.abs(e) - t, Math.max(0, nt(e) - nt(t)) + 1;
}
function pe(t, e) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(t);
      break;
    default:
      this.range(e).domain(t);
      break;
  }
  return this;
}
const He = Symbol("implicit");
function xn() {
  var t = new ge(), e = [], n = [], r = He;
  function i(a) {
    let o = t.get(a);
    if (o === void 0) {
      if (r !== He) return r;
      t.set(a, o = e.push(a) - 1);
    }
    return n[o % n.length];
  }
  return i.domain = function(a) {
    if (!arguments.length) return e.slice();
    e = [], t = new ge();
    for (const o of a)
      t.has(o) || t.set(o, e.push(o) - 1);
    return i;
  }, i.range = function(a) {
    return arguments.length ? (n = Array.from(a), i) : n.slice();
  }, i.unknown = function(a) {
    return arguments.length ? (r = a, i) : r;
  }, i.copy = function() {
    return xn(e, n).unknown(r);
  }, pe.apply(i, arguments), i;
}
function wn() {
  var t = xn().unknown(void 0), e = t.domain, n = t.range, r = 0, i = 1, a, o, s = !1, l = 0, u = 0, c = 0.5;
  delete t.unknown;
  function h() {
    var f = e().length, d = i < r, x = d ? i : r, g = d ? r : i;
    a = (g - x) / Math.max(1, f - l + u * 2), s && (a = Math.floor(a)), x += (g - x - a * (f - l)) * c, o = a * (1 - l), s && (x = Math.round(x), o = Math.round(o));
    var M = Pn(f).map(function(C) {
      return x + a * C;
    });
    return n(d ? M.reverse() : M);
  }
  return t.domain = function(f) {
    return arguments.length ? (e(f), h()) : e();
  }, t.range = function(f) {
    return arguments.length ? ([r, i] = f, r = +r, i = +i, h()) : [r, i];
  }, t.rangeRound = function(f) {
    return [r, i] = f, r = +r, i = +i, s = !0, h();
  }, t.bandwidth = function() {
    return o;
  }, t.step = function() {
    return a;
  }, t.round = function(f) {
    return arguments.length ? (s = !!f, h()) : s;
  }, t.padding = function(f) {
    return arguments.length ? (l = Math.min(1, u = +f), h()) : l;
  }, t.paddingInner = function(f) {
    return arguments.length ? (l = Math.min(1, f), h()) : l;
  }, t.paddingOuter = function(f) {
    return arguments.length ? (u = +f, h()) : u;
  }, t.align = function(f) {
    return arguments.length ? (c = Math.max(0, Math.min(1, f)), h()) : c;
  }, t.copy = function() {
    return wn(e(), [r, i]).round(s).paddingInner(l).paddingOuter(u).align(c);
  }, pe.apply(h(), arguments);
}
function Co(t) {
  return function() {
    return t;
  };
}
function To(t) {
  return +t;
}
var qe = [0, 1];
function J(t) {
  return t;
}
function ee(t, e) {
  return (e -= t = +t) ? function(n) {
    return (n - t) / e;
  } : Co(isNaN(e) ? NaN : 0.5);
}
function Ro(t, e) {
  var n;
  return t > e && (n = t, t = e, e = n), function(r) {
    return Math.max(t, Math.min(e, r));
  };
}
function Fo(t, e, n) {
  var r = t[0], i = t[1], a = e[0], o = e[1];
  return i < r ? (r = ee(i, r), a = n(o, a)) : (r = ee(r, i), a = n(a, o)), function(s) {
    return a(r(s));
  };
}
function Po(t, e, n) {
  var r = Math.min(t.length, e.length) - 1, i = new Array(r), a = new Array(r), o = -1;
  for (t[r] < t[0] && (t = t.slice().reverse(), e = e.slice().reverse()); ++o < r; )
    i[o] = ee(t[o], t[o + 1]), a[o] = n(e[o], e[o + 1]);
  return function(s) {
    var l = An(t, s, 1, r) - 1;
    return a[l](i[l](s));
  };
}
function Io(t, e) {
  return e.domain(t.domain()).range(t.range()).interpolate(t.interpolate()).clamp(t.clamp()).unknown(t.unknown());
}
function Oo() {
  var t = qe, e = qe, n = le, r, i, a, o = J, s, l, u;
  function c() {
    var f = Math.min(t.length, e.length);
    return o !== J && (o = Ro(t[0], t[f - 1])), s = f > 2 ? Po : Fo, l = u = null, h;
  }
  function h(f) {
    return f == null || isNaN(f = +f) ? a : (l || (l = s(t.map(r), e, n)))(r(o(f)));
  }
  return h.invert = function(f) {
    return o(i((u || (u = s(e, t.map(r), D)))(f)));
  }, h.domain = function(f) {
    return arguments.length ? (t = Array.from(f, To), c()) : t.slice();
  }, h.range = function(f) {
    return arguments.length ? (e = Array.from(f), c()) : e.slice();
  }, h.rangeRound = function(f) {
    return e = Array.from(f), n = ea, c();
  }, h.clamp = function(f) {
    return arguments.length ? (o = f ? !0 : J, c()) : o !== J;
  }, h.interpolate = function(f) {
    return arguments.length ? (n = f, c()) : n;
  }, h.unknown = function(f) {
    return arguments.length ? (a = f, h) : a;
  }, function(f, d) {
    return r = f, i = d, c();
  };
}
function zo() {
  return Oo()(J, J);
}
function Do(t, e, n, r) {
  var i = Fn(t, e, n), a;
  switch (r = Ft(r ?? ",f"), r.type) {
    case "s": {
      var o = Math.max(Math.abs(t), Math.abs(e));
      return r.precision == null && !isNaN(a = $o(i, o)) && (r.precision = a), yn(r, o);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      r.precision == null && !isNaN(a = Eo(i, Math.max(Math.abs(t), Math.abs(e)))) && (r.precision = a - (r.type === "e"));
      break;
    }
    case "f":
    case "%": {
      r.precision == null && !isNaN(a = So(i)) && (r.precision = a - (r.type === "%") * 2);
      break;
    }
  }
  return mn(r);
}
function Xo(t) {
  var e = t.domain;
  return t.ticks = function(n) {
    var r = e();
    return Rn(r[0], r[r.length - 1], n ?? 10);
  }, t.tickFormat = function(n, r) {
    var i = e();
    return Do(i[0], i[i.length - 1], n ?? 10, r);
  }, t.nice = function(n) {
    n == null && (n = 10);
    var r = e(), i = 0, a = r.length - 1, o = r[i], s = r[a], l, u, c = 10;
    for (s < o && (u = o, o = s, s = u, u = i, i = a, a = u); c-- > 0; ) {
      if (u = Yt(o, s, n), u === l)
        return r[i] = o, r[a] = s, e(r);
      if (u > 0)
        o = Math.floor(o / u) * u, s = Math.ceil(s / u) * u;
      else if (u < 0)
        o = Math.ceil(o * u) / u, s = Math.floor(s * u) / u;
      else
        break;
      l = u;
    }
    return t;
  }, t;
}
function Pt() {
  var t = zo();
  return t.copy = function() {
    return Io(t, Pt());
  }, pe.apply(t, arguments), Xo(t);
}
function st(t, e, n) {
  this.k = t, this.x = e, this.y = n;
}
st.prototype = {
  constructor: st,
  scale: function(t) {
    return t === 1 ? this : new st(this.k * t, this.x, this.y);
  },
  translate: function(t, e) {
    return t === 0 & e === 0 ? this : new st(this.k, this.x + this.k * t, this.y + this.k * e);
  },
  apply: function(t) {
    return [t[0] * this.k + this.x, t[1] * this.k + this.y];
  },
  applyX: function(t) {
    return t * this.k + this.x;
  },
  applyY: function(t) {
    return t * this.k + this.y;
  },
  invert: function(t) {
    return [(t[0] - this.x) / this.k, (t[1] - this.y) / this.k];
  },
  invertX: function(t) {
    return (t - this.x) / this.k;
  },
  invertY: function(t) {
    return (t - this.y) / this.k;
  },
  rescaleX: function(t) {
    return t.copy().domain(t.range().map(this.invertX, this).map(t.invert, t));
  },
  rescaleY: function(t) {
    return t.copy().domain(t.range().map(this.invertY, this).map(t.invert, t));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
st.prototype;
function kt(t, {
  series2: e = { data: null, name: "cohort 2" },
  // default object
  dimensions: {
    xlabel: n = "",
    ylabel: r = "",
    title: i = "",
    width: a = 600,
    height: o = 400,
    margin: s = { top: 40, right: 10, bottom: 60, left: 80 },
    padding: l = 0.1
  } = {}
} = {}) {
  if (!t || !t.data)
    throw new Error("SvgVerticalBarChart requires series1 with a 'data' property.");
  t.name || (t.name = "cohort 1");
  let u = oe("svg").attr("class", "barchart").attr("width", a).attr("height", o).attr("viewBox", `0 0 ${a} ${o}`).attr("preserveAspectRatio", "xMidYMid meet");
  const c = e.data ? t.data.concat(e.data) : t.data, h = wn(
    t.data.map((d) => d.category),
    [s.left, a - s.right]
  ).padding(l), f = Pt(
    [0, Bt(c, (d) => d.value)],
    [o - s.bottom, s.top]
  ).nice();
  if (u.append("g").attr("transform", `translate(0, ${o - s.bottom})`).call(qn(h)).attr("class", "axis"), u.append("text").attr("class", "axis-label").attr("x", a / 2).attr("y", o - 20).style("text-anchor", "middle").text(n), u.append("g").attr("transform", `translate(${s.left}, 0)`).call(Vn(f)).attr("class", "axis"), u.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", o / 2 * -1).attr("y", 20).attr("text-anchor", "middle").text(r), i === "" && n !== "" && (i = n + " Distribution"), u.append("text").attr("class", "chart-title").attr("text-anchor", "middle").attr("x", a / 2).attr("y", s.top / 2).text(i), u.selectAll(".bar1").data(t.data).enter().append("rect").attr("class", "bar1").attr("x", (d) => h(d.category)).attr("y", (d) => f(d.value)).attr("width", h.bandwidth()).attr("height", (d) => o - s.bottom - f(d.value)), e.data && e.data.length > 0) {
    u.selectAll(".bar2").data(e.data).enter().append("rect").attr("class", "bar2").attr("x", (g) => h(g.category) + h.bandwidth() / 2).attr("y", (g) => f(g.value)).attr("width", h.bandwidth() / 2).attr("height", (g) => o - s.bottom - f(g.value)), u.selectAll(".label2").data(e.data).enter().append("text").attr("class", "label2").attr("x", (g) => h(g.category) + h.bandwidth() / 2 + 25).attr("y", (g) => f(g.value) - 5).attr("text-anchor", "middle").text((g) => g.value), u.selectAll(".label1").data(t.data).enter().append("text").attr("class", "label1").attr("x", (g) => h(g.category) + h.bandwidth() / 2 - h.bandwidth() / 4).attr("y", (g) => f(g.value) - 5).attr("text-anchor", "middle").text((g) => g.value);
    const d = [
      { label: t.name, color: "steelblue" },
      { label: e.name, color: "orange" }
    ], x = u.append("g").attr("class", "legend").attr("transform", `translate(${s.left}, ${o - 20})`);
    x.selectAll("rect").data(d).enter().append("rect").attr("x", (g, M) => M * 100).attr("y", 0).attr("width", 18).attr("height", 18).attr("fill", (g) => g.color), x.selectAll("text").data(d).enter().append("text").attr("x", (g, M) => M * 100 + 24).attr("y", 9).attr("dy", "0.35em").text((g) => g.label);
  } else
    u.selectAll(".label1").data(t.data).enter().append("text").attr("class", "label1").attr("x", (d) => h(d.category) + h.bandwidth() / 2 + 5).attr("y", (d) => f(d.value) - 5).attr("text-anchor", "middle").text((d) => d.value);
  return u;
}
const Go = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VerticalBarChart: kt
}, Symbol.toStringTag, { value: "Module" }));
function Ho(t) {
  t.selectAll("*").remove();
}
function qo(t) {
  return new Date(t).toISOString().split("T")[0];
}
function _n(t) {
  return t.map((e) => e.split("_").map((n) => n.charAt(0).toUpperCase() + n.slice(1)).join(" "));
}
const Wo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clearElement: Ho,
  getIsoDateString: qo,
  makeKeysWords: _n
}, Symbol.toStringTag, { value: "Module" }));
function Vo(t, e) {
  let n = t.map((i) => {
    const a = e.find((o) => o.concept_code === i.concept_code);
    return Object.assign({}, i, a);
  });
  n = n.map((i) => (i.difference = (i.study_prevalence ?? 0) - (i.base_prevalence ?? 0), i.bias = Math.abs(i.difference), delete i.study_count, delete i.base_count, delete i.ancestor_concept_id, delete i.descendant_concept_id, i));
  const r = ["concept_code", "concept_name", "base_prevalence", "difference", "study_prevalence", "bias"];
  return n = n.map((i) => {
    const a = {};
    return r.forEach((o) => {
      i.hasOwnProperty(o) && (a[o] = i[o]);
    }), a;
  }), n.sort((i, a) => a.bias - i.bias), n;
}
function Lo(t, e, n) {
  t.on("filter", (r) => {
    const i = r.toLowerCase().replace(/[^a-z0-9]/g, "");
    e.style("display", null), e.filter((o) => {
      const s = o.concept_code.toLowerCase(), l = o.concept_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return !(s.startsWith(i) || l.includes(i));
    }).style("display", "none");
    let a = 0;
    e.filter(function() {
      return I(this).style("display") !== "none";
    }).each(function() {
      I(this).attr("transform", `translate(0, ${a})`), a += parseFloat(I(this).select("rect").attr("height"));
    }), n.attr("height", a);
  });
}
function ne(t, e, {
  data2: n = null,
  dimensions: r = { height: 432, row_height: 30 }
} = {}) {
  if (t === null)
    throw new Error("drawConceptsTable requires a 'data' parameter.");
  if (!e || typeof e != "object" || typeof e.call != "function" || typeof e.on != "function")
    throw new Error("drawConceptsTable requires a valid d3.dispatch object.");
  if (n !== null && !Array.isArray(n) && console.warn("drawConceptsTable: 'data2' should be an array (or null)."), typeof r != "object" || r === null)
    throw new Error("drawConceptsTable: 'dimensions' must be an object.");
  let i;
  n !== null ? i = Vo(t, n) : i = t;
  const a = 10, { height: o, row_height: s } = r, l = oe("div").style("width", "100%").style("max-height", o + "px").style("overflow", "auto").style("position", "relative").style("border", "1px solid #ccc").style("font-family", "sans-serif"), u = _n(Object.keys(i[0]));
  if (!i.length)
    throw new Error("drawConceptsTable: table_data is empty.");
  let c;
  n === null ? c = [
    { text: u[1], field: "concept_code", x: 0, width: 160 },
    { text: u[0], field: "concept_name", x: 160, width: 590 },
    { text: u[2], field: "count_in_cohort", x: 750, width: 160 },
    {
      text: u[3],
      field: (m) => m.prevalence !== null ? m.prevalence.toFixed(3) : "",
      x: 910,
      width: 160
    }
  ] : c = [
    { text: u[0], field: "concept_code", x: 0, width: 140, type: "text" },
    { text: u[1], field: "concept_name", x: 140, width: 330, type: "text" },
    {
      text: u[2],
      field: (m) => m.base_prevalence !== null ? m.base_prevalence.toFixed(3) : "",
      x: 470,
      width: 120,
      type: "text"
    },
    { text: u[3], field: "difference", x: 590, width: 240, type: "compare_bars" },
    {
      text: u[4],
      field: (m) => m.study_prevalence !== null ? m.study_prevalence.toFixed(3) : "",
      x: 830,
      width: 120,
      type: "text"
    },
    { text: u[5], field: "bias", x: 950, width: 120, type: "bar" }
  ];
  const h = ye(c, (m) => m.width), f = l.append("svg").attr("width", h).attr("height", s).style("position", "sticky").style("top", 0).style("background", "white").style("z-index", 1), d = f.append("g"), x = d.selectAll("g").data(c).enter().append("g").attr("transform", (m) => `translate(${m.x},0)`);
  x.append("rect").attr("width", (m) => m.width).attr("height", s).attr("fill", "#d0d0d0").attr("stroke", "#fff"), x.append("text").attr("x", a).attr("y", s / 2).attr("dy", "0.35em").attr("text-anchor", "start").text((m) => m.text), x.append("rect").attr("class", "resize-handle").attr("x", (m) => m.width - 5).attr("y", 0).attr("width", 5).attr("height", s).style("cursor", "col-resize").style("fill", "transparent").call(
    Ri().on("start", function(m, _) {
      _.startWidth = _.width, _.startX = m.x;
    }).on("drag", function(m, _) {
      const k = m.x - _.startX, T = Math.max(30, _.startWidth + k);
      _.width = T, I(this.parentNode).select("rect").attr("width", T), I(this).attr("x", T - 5);
      let z = 0;
      c.forEach((R) => {
        R.x = z, z += R.width;
      }), d.selectAll("g").attr("transform", (R) => `translate(${R.x},0)`), g.selectAll(".row").each(function(R) {
        I(this).selectAll(".cell").attr("transform", (F, U) => `translate(${c[U].x},0)`).select(".cell_bg").attr("width", (F, U) => c[U].width);
      });
      const q = ye(c, (R) => R.width);
      g.attr("width", q), f.attr("width", q);
    })
  );
  const g = l.append("svg").attr("width", h).attr("height", i.length * s), C = g.append("g").selectAll(".row").data(i).enter().append("g").attr("class", "row").attr("transform", (m, _) => `translate(0, ${_ * s})`);
  let E, N, p = 5;
  n !== null && (E = Bt(i, (m) => Math.abs(m.bias)) || 0, N = Bt(i, (m) => Math.abs(m.difference)) || 0);
  const w = Pt(), b = Pt();
  let v, A, S, $, y;
  return c.forEach((m) => {
    const _ = C.append("g").attr("class", "cell").attr("transform", `translate(${m.x},0)`);
    if (_.append("rect").attr("class", "cell-bg").attr("width", m.width).attr("height", s).attr("fill", "#f0f0f0").attr("stroke", "#ccc"), n === null)
      _.append("text").attr("x", a).attr("y", s / 2).attr("dy", "0.35em").attr("text-anchor", "start").text((k) => {
        const T = typeof m.field == "function" ? m.field(k) : k[m.field];
        return T !== null ? T : "";
      });
    else
      switch (m.type) {
        case "text":
          _.append("text").attr("x", a).attr("y", s / 2).attr("dy", "0.35em").attr("text-anchor", "start").text((k) => {
            const T = typeof m.field == "function" ? m.field(k) : k[m.field];
            return T !== null ? T : "";
          });
          break;
        case "bar":
          w.domain([0, E || 1]).range([p, m.width - p]), _.each(function(k) {
            A = I(this), S = s, $ = p, y = S - 2 * p, A.append("rect").attr("x", 0).attr("y", $).attr("width", w(Math.abs(k.bias))).attr("height", y).attr("fill", "lightslategrey"), A.append("text").attr("x", 4).attr("y", S / 2 + 4).attr("font-size", "10px").attr("fill", "black").text(k.bias !== null ? k.bias.toFixed(3) : "");
          });
          break;
        case "compare_bars":
          b.domain([-N || -1, N || 1]).range([p, m.width - p]), v = b(0), _.each(function(k) {
            A = I(this), S = s, $ = 5, y = S - 2 * p, A.append("rect").attr("x", Math.min(v, b(k.difference))).attr("y", $).attr("width", Math.abs(b(k.difference) - v)).attr("height", y).attr("fill", k.difference < 0 ? "orange" : "steelblue"), A.append("text").attr("x", v).attr("y", s / 2 + 4).attr("text-anchor", "middle").attr("font-size", "10px").text(k.difference !== null ? k.difference.toFixed(3) : "");
          });
          break;
        default:
          throw new Error(`Unknown column type: ${m.type}`);
      }
  }), Lo(e, C, g), l;
}
const Ko = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ConceptsTable: ne
}, Symbol.toStringTag, { value: "Module" }));
function Yo(t, e, n, r, i, a, o, s) {
  let l = It("filter", "sort"), u = document.createElement("div");
  u.setAttribute("class", "vis-container");
  let c = u.appendChild(document.createElement("div"));
  c.setAttribute("class", "row-container");
  let h = c.appendChild(document.createElement("div"));
  h.setAttribute("class", "col-container");
  let f = c.appendChild(document.createElement("div"));
  f.setAttribute("class", "col-container");
  let d = c.appendChild(document.createElement("div"));
  d.setAttribute("class", "col-container");
  let x = u.appendChild(document.createElement("div"));
  x.setAttribute("class", "row-container concepts-row");
  let g = x.appendChild(document.createElement("div"));
  return g.setAttribute("class", "col-container"), h.appendChild(
    kt(
      { data: n },
      { series2: { data: o }, dimensions: { xlabel: "Gender" } }
    ).node()
  ), f.appendChild(
    kt(
      { data: e },
      { series2: { data: a }, dimensions: { xlabel: "Race" } }
    ).node()
  ), d.appendChild(
    kt(
      { data: r },
      { series2: { data: s }, dimensions: { xlabel: "Age" } }
    ).node()
  ), g.appendChild(
    controls.SearchBox(l).node()
  ), Object.keys(i).length === 0 ? g.appendChild(
    ne(t, l).node()
  ) : g.appendChild(
    ne(t, l, { data2: i }).node()
  ), u;
}
function Bo(t, e = "Search", n = 300) {
  let r = oe("xhtml:div").attr("xmlns", "http://www.w3.org/1999/xhtml").style("padding", "10px");
  return r.append("input").attr("type", "text").attr("placeholder", e).on("input", function(a) {
    t.call("filter", this, a.target.value);
  }), r;
}
const Zo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SearchBox: Bo
}, Symbol.toStringTag, { value: "Module" }));
function Uo({ model: t, el: e }) {
  console.log("hello");
  const n = t.get("_concepts1"), r = t.get("_race_stats1"), i = t.get("_gender_dist1"), a = t.get("_age_dist1"), o = t.get("_concepts2"), s = t.get("_race_stats2"), l = t.get("_gender_dist2"), u = t.get("_age_dist2");
  e.appendChild(Yo(
    n,
    r,
    i,
    a,
    o,
    s,
    l,
    u
  ));
}
const Jo = { render: Uo };
export {
  Go as barcharts,
  Zo as controls,
  Jo as default,
  Yo as drawVis,
  Ko as tables,
  Wo as utils
};
