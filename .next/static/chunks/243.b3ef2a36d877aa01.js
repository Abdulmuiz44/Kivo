'use strict';
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [243],
  {
    2243: function (e, t, n) {
      (Object.defineProperty(t, '__esModule', { value: !0 }),
        Object.defineProperty(t, 'default', {
          enumerable: !0,
          get: function () {
            return r;
          },
        }));
      let l = n(2430),
        u = n(2676),
        a = l._(n(5271)),
        o = n(934);
      async function s(e) {
        let { Component: t, ctx: n } = e;
        return { pageProps: await (0, o.loadGetInitialProps)(t, n) };
      }
      class r extends a.default.Component {
        render() {
          let { Component: e, pageProps: t } = this.props;
          return (0, u.jsx)(e, Object.assign({}, t));
        }
      }
      ((r.origGetInitialProps = s),
        (r.getInitialProps = s),
        ('function' == typeof t.default || ('object' == typeof t.default && null !== t.default)) &&
          void 0 === t.default.__esModule &&
          (Object.defineProperty(t.default, '__esModule', { value: !0 }),
          Object.assign(t.default, t),
          (e.exports = t.default)));
    },
  },
]);
