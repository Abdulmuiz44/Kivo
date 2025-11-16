(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [888, 243],
  {
    2243: function (e, t, n) {
      'use strict';
      (Object.defineProperty(t, '__esModule', { value: !0 }),
        Object.defineProperty(t, 'default', {
          enumerable: !0,
          get: function () {
            return l;
          },
        }));
      let u = n(2430),
        o = n(2676),
        r = u._(n(5271)),
        a = n(934);
      async function i(e) {
        let { Component: t, ctx: n } = e;
        return { pageProps: await (0, a.loadGetInitialProps)(t, n) };
      }
      class l extends r.default.Component {
        render() {
          let { Component: e, pageProps: t } = this.props;
          return (0, o.jsx)(e, Object.assign({}, t));
        }
      }
      ((l.origGetInitialProps = i),
        (l.getInitialProps = i),
        ('function' == typeof t.default || ('object' == typeof t.default && null !== t.default)) &&
          void 0 === t.default.__esModule &&
          (Object.defineProperty(t.default, '__esModule', { value: !0 }),
          Object.assign(t.default, t),
          (e.exports = t.default)));
    },
    7604: function (e, t, n) {
      (window.__NEXT_P = window.__NEXT_P || []).push([
        '/_app',
        function () {
          return n(2243);
        },
      ]);
    },
  },
  function (e) {
    var t = function (t) {
      return e((e.s = t));
    };
    (e.O(0, [774, 179], function () {
      return (t(7604), t(5088));
    }),
      (_N_E = e.O()));
  },
]);
