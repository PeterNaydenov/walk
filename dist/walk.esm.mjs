//#region src/findType.js
function e(e) {
	return e == null || e.nodeType ? "simple" : Array.isArray(e) ? "array" : typeof e == "object" ? e instanceof Date || e instanceof RegExp || e instanceof Map || e instanceof Set || e instanceof WeakMap || e instanceof WeakSet || e instanceof ArrayBuffer || e instanceof DataView || ArrayBuffer.isView(e) ? "simple" : "object" : "simple";
}
//#endregion
//#region src/validateForInsertion.js
function t(e, t) {
	if (!Array.isArray(t)) return !1;
	let n = Number(e);
	return Number.isInteger(n) && n >= 0 && n < 4294967295 && String(n) === e;
}
//#endregion
//#region src/setKey.js
function n(e, t, n) {
	t === "__proto__" ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		writable: !0,
		configurable: !0
	}) : e[t] = n;
}
//#endregion
//#region src/finish.js
var r = /* @__PURE__ */ new WeakSet();
function i(e) {
	let t = Object.freeze({
		value: e,
		hasValue: arguments.length > 0
	});
	return r.add(t), t;
}
function a(e) {
	return r.has(e);
}
//#endregion
//#region src/createCallbackArgs.js
function o(e, t, n, r, a, o) {
	return o.breadcrumbs && o.parentPath ? {
		value: e,
		key: t,
		breadcrumbs: r,
		parentPath: a,
		IGNORE: n,
		FINISH: i
	} : o.breadcrumbs ? {
		value: e,
		key: t,
		breadcrumbs: r,
		IGNORE: n,
		FINISH: i
	} : o.parentPath ? {
		value: e,
		key: t,
		parentPath: a,
		IGNORE: n,
		FINISH: i
	} : {
		value: e,
		key: t,
		IGNORE: n,
		FINISH: i
	};
}
//#endregion
//#region src/pass.js
var s = /* @__PURE__ */ new WeakSet();
function c(e) {
	let t = Object.freeze({
		value: e,
		hasValue: arguments.length > 0
	});
	return s.add(t), t;
}
function l(e) {
	return s.has(e);
}
//#endregion
//#region src/ignore.js
var u = Symbol("ignore___");
function d() {
	return u;
}
function f(e) {
	return e === u;
}
//#endregion
//#region src/copyObject.js
function p(r, i, s, u, p, _, v, y, b, x, S, ...C) {
	let [w, T] = u, E = Object.keys(r), D = _.detectCycles ? {
		data: r,
		location: i,
		parent: x,
		depth: x ? x.depth + 1 : 0
	} : void 0, O = !1;
	S && S.set(r, D);
	for (let u = 0; u < E.length && !O; u++) {
		let x = E[u], k = r[x], A = e(k), j = _.copy && t(x, i), M = _.breadcrumbs && (A !== "simple" || !b && w) ? `${p}/${x}` : void 0, N = !1;
		if (A !== "simple" && T && !v.isFinished) {
			let t = o(k, x, d, M, y, _);
			t.PASS = c;
			let n = T(t, ...C);
			if (a(n)) {
				if (!n.hasValue || !w) return m(n, i, x, j, _, v), D;
				s.length = 0, v.restart = !0, v.isFinished = !0, O = !0, k = n.value;
			} else if (f(n)) continue;
			else l(n) ? (N = !0, n.hasValue && (k = n.value)) : k = n;
			A = e(k);
		}
		if (A === "simple") {
			if (N || b && !v.isFinished || !w) {
				if (!_.copy) continue;
				j ? i.push(k) : n(i, x, k);
				continue;
			}
			let t = o(k, x, d, M, y, _);
			t.isFinished = v.isFinished;
			let r = w(t, ...C);
			if (a(r)) return m(r, i, x, j, _, v), D;
			if (f(r)) continue;
			let s = e(r);
			if (s === "simple") {
				if (!_.copy) continue;
				j ? i.push(r) : n(i, x, r);
				continue;
			}
			k = r, A = s;
		}
		let P = _.detectCycles ? g(k, D, S) : void 0;
		if (P) {
			if (!_.copy) continue;
			j ? i.push(P.location) : n(i, x, P.location);
		} else {
			if (A === "object") {
				let e = _.copy ? {} : void 0;
				_.copy && (j ? i.push(e) : n(i, x, e)), s.push(h(k, e, M, y, x, N, D));
			}
			if (A === "array") {
				let e = _.copy ? [] : void 0;
				_.copy && (j ? i.push(e) : n(i, x, e)), s.push(h(k, e, M, y, x, N, D));
			}
		}
	}
	return D;
}
function m(e, t, r, i, a, o) {
	o.finished = !0, a.copy && e.hasValue && (i ? t.push(e.value) : n(t, r, e.value));
}
function h(e, t, n, r, i, a, o) {
	return {
		data: e,
		location: t,
		breadcrumbs: n,
		parentPath: r,
		key: i,
		pass: a,
		parent: o
	};
}
function g(e, t, n) {
	if (n) return n.get(e);
	for (let n = t; n; n = n.parent) if (n.data === e) return n;
}
//#endregion
//#region src/main.js
function _(t, ...n) {
	let { data: r, keyCallback: i, objectCallback: s, settings: u } = t, m = e(r), h, g = [], _, y, b = {
		finished: !1,
		isFinished: !1,
		restart: !1
	}, x = !!(i || s), S = {
		copy: (u == null ? void 0 : u.copy) !== !1,
		breadcrumbs: x && (u == null ? void 0 : u.breadcrumbs) !== !1,
		parentPath: x && (u == null ? void 0 : u.parentPath) !== !1,
		detectCycles: (u == null ? void 0 : u.detectCycles) !== !1
	}, C = S.breadcrumbs ? "root" : void 0, w = S.parentPath && m !== "simple" ? Object.freeze(["root"]) : void 0, T = !1, E = [i, s];
	if (m !== "simple" && s) {
		let t = S.parentPath ? Object.freeze([]) : void 0, u = o(r, "root", d, C, t, S);
		u.PASS = c;
		let p = s(u, ...n);
		if (a(p)) {
			if (!p.hasValue) return S.copy ? m === "array" ? [] : {} : void 0;
			if (!i) return S.copy ? p.value : void 0;
			b.isFinished = !0, r = p.value;
		} else if (f(p)) return S.copy ? m === "array" ? [] : {} : void 0;
		else l(p) ? (T = !0, p.hasValue && (r = p.value)) : r = p;
		m = e(r);
	}
	switch (m) {
		case "array":
			h = S.copy ? [] : void 0, y = p(r, h, g, E, C, S, b, w, T, void 0, _, ...n);
			break;
		case "object":
			h = S.copy ? {} : void 0, y = p(r, h, g, E, C, S, b, w, T, void 0, _, ...n);
			break;
		case "simple": return S.copy ? r : void 0;
	}
	for (let e = 0; e < g.length && !b.finished;) {
		let t = g[e];
		g[e] = void 0, b.restart = !1, S.detectCycles && (_ = v(y, t.parent, _));
		let r = S.parentPath ? Object.freeze([...t.parentPath, t.key]) : void 0;
		y = p(t.data, t.location, g, E, t.breadcrumbs, S, b, r, t.pass, t.parent, _, ...n), e = b.restart ? 0 : e + 1;
	}
	return h;
}
function v(e, t, n) {
	if (!n) {
		if (t.depth < 32) return;
		n = /* @__PURE__ */ new WeakMap();
		for (let e = t; e; e = e.parent) n.set(e.data, e);
		return n;
	}
	let r = [];
	for (; e !== t;) e.depth >= t.depth ? (n.delete(e.data), e = e.parent) : (r.push(t), t = t.parent);
	for (let e = r.length - 1; e >= 0; e--) {
		let t = r[e];
		n.set(t.data, t);
	}
	return n;
}
//#endregion
export { _ as default };
