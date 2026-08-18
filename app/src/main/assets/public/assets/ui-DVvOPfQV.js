function rt(o,a){for(var f=0;f<a.length;f++){const l=a[f];if(typeof l!="string"&&!Array.isArray(l)){for(const d in l)if(d!=="default"&&!(d in o)){const _=Object.getOwnPropertyDescriptor(l,d);_&&Object.defineProperty(o,d,_.get?_:{enumerable:!0,get:()=>l[d]})}}}return Object.freeze(Object.defineProperty(o,Symbol.toStringTag,{value:"Module"}))}function st(o){return o&&o.__esModule&&Object.prototype.hasOwnProperty.call(o,"default")?o.default:o}var P={exports:{}},n={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Z;function at(){if(Z)return n;Z=1;var o=Symbol.for("react.transitional.element"),a=Symbol.for("react.portal"),f=Symbol.for("react.fragment"),l=Symbol.for("react.strict_mode"),d=Symbol.for("react.profiler"),_=Symbol.for("react.consumer"),b=Symbol.for("react.context"),m=Symbol.for("react.forward_ref"),R=Symbol.for("react.suspense"),k=Symbol.for("react.memo"),g=Symbol.for("react.lazy"),M=Symbol.for("react.activity"),x=Symbol.iterator;function $(t){return t===null||typeof t!="object"?null:(t=x&&t[x]||t["@@iterator"],typeof t=="function"?t:null)}var q={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},z=Object.assign,I={};function w(t,e,s){this.props=t,this.context=e,this.refs=I,this.updater=s||q}w.prototype.isReactComponent={},w.prototype.setState=function(t,e){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,e,"setState")},w.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function Y(){}Y.prototype=w.prototype;function S(t,e,s){this.props=t,this.context=e,this.refs=I,this.updater=s||q}var N=S.prototype=new Y;N.constructor=S,z(N,w.prototype),N.isPureReactComponent=!0;var D=Array.isArray;function j(){}var p={H:null,A:null,T:null,S:null},U=Object.prototype.hasOwnProperty;function H(t,e,s){var r=s.ref;return{$$typeof:o,type:t,key:e,ref:r!==void 0?r:null,props:s}}function J(t,e){return H(t.type,e,t.props)}function O(t){return typeof t=="object"&&t!==null&&t.$$typeof===o}function F(t){var e={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(s){return e[s]})}var B=/\/+/g;function L(t,e){return typeof t=="object"&&t!==null&&t.key!=null?F(""+t.key):e.toString(36)}function tt(t){switch(t.status){case"fulfilled":return t.value;case"rejected":throw t.reason;default:switch(typeof t.status=="string"?t.then(j,j):(t.status="pending",t.then(function(e){t.status==="pending"&&(t.status="fulfilled",t.value=e)},function(e){t.status==="pending"&&(t.status="rejected",t.reason=e)})),t.status){case"fulfilled":return t.value;case"rejected":throw t.reason}}throw t}function C(t,e,s,r,u){var i=typeof t;(i==="undefined"||i==="boolean")&&(t=null);var y=!1;if(t===null)y=!0;else switch(i){case"bigint":case"string":case"number":y=!0;break;case"object":switch(t.$$typeof){case o:case a:y=!0;break;case g:return y=t._init,C(y(t._payload),e,s,r,u)}}if(y)return u=u(t),y=r===""?"."+L(t,0):r,D(u)?(s="",y!=null&&(s=y.replace(B,"$&/")+"/"),C(u,e,s,"",function(nt){return nt})):u!=null&&(O(u)&&(u=J(u,s+(u.key==null||t&&t.key===u.key?"":(""+u.key).replace(B,"$&/")+"/")+y)),e.push(u)),1;y=0;var v=r===""?".":r+":";if(D(t))for(var h=0;h<t.length;h++)r=t[h],i=v+L(r,h),y+=C(r,e,s,i,u);else if(h=$(t),typeof h=="function")for(t=h.call(t),h=0;!(r=t.next()).done;)r=r.value,i=v+L(r,h++),y+=C(r,e,s,i,u);else if(i==="object"){if(typeof t.then=="function")return C(tt(t),e,s,r,u);throw e=String(t),Error("Objects are not valid as a React child (found: "+(e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)+"). If you meant to render a collection of children, use an array instead.")}return y}function T(t,e,s){if(t==null)return t;var r=[],u=0;return C(t,r,"","",function(i){return e.call(s,i,u++)}),r}function et(t){if(t._status===-1){var e=t._result;e=e(),e.then(function(s){(t._status===0||t._status===-1)&&(t._status=1,t._result=s)},function(s){(t._status===0||t._status===-1)&&(t._status=2,t._result=s)}),t._status===-1&&(t._status=0,t._result=e)}if(t._status===1)return t._result.default;throw t._result}var V=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var e=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(e))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},ot={map:T,forEach:function(t,e,s){T(t,function(){e.apply(this,arguments)},s)},count:function(t){var e=0;return T(t,function(){e++}),e},toArray:function(t){return T(t,function(e){return e})||[]},only:function(t){if(!O(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};return n.Activity=M,n.Children=ot,n.Component=w,n.Fragment=f,n.Profiler=d,n.PureComponent=S,n.StrictMode=l,n.Suspense=R,n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=p,n.__COMPILER_RUNTIME={__proto__:null,c:function(t){return p.H.useMemoCache(t)}},n.cache=function(t){return function(){return t.apply(null,arguments)}},n.cacheSignal=function(){return null},n.cloneElement=function(t,e,s){if(t==null)throw Error("The argument must be a React element, but you passed "+t+".");var r=z({},t.props),u=t.key;if(e!=null)for(i in e.key!==void 0&&(u=""+e.key),e)!U.call(e,i)||i==="key"||i==="__self"||i==="__source"||i==="ref"&&e.ref===void 0||(r[i]=e[i]);var i=arguments.length-2;if(i===1)r.children=s;else if(1<i){for(var y=Array(i),v=0;v<i;v++)y[v]=arguments[v+2];r.children=y}return H(t.type,u,r)},n.createContext=function(t){return t={$$typeof:b,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null},t.Provider=t,t.Consumer={$$typeof:_,_context:t},t},n.createElement=function(t,e,s){var r,u={},i=null;if(e!=null)for(r in e.key!==void 0&&(i=""+e.key),e)U.call(e,r)&&r!=="key"&&r!=="__self"&&r!=="__source"&&(u[r]=e[r]);var y=arguments.length-2;if(y===1)u.children=s;else if(1<y){for(var v=Array(y),h=0;h<y;h++)v[h]=arguments[h+2];u.children=v}if(t&&t.defaultProps)for(r in y=t.defaultProps,y)u[r]===void 0&&(u[r]=y[r]);return H(t,i,u)},n.createRef=function(){return{current:null}},n.forwardRef=function(t){return{$$typeof:m,render:t}},n.isValidElement=O,n.lazy=function(t){return{$$typeof:g,_payload:{_status:-1,_result:t},_init:et}},n.memo=function(t,e){return{$$typeof:k,type:t,compare:e===void 0?null:e}},n.startTransition=function(t){var e=p.T,s={};p.T=s;try{var r=t(),u=p.S;u!==null&&u(s,r),typeof r=="object"&&r!==null&&typeof r.then=="function"&&r.then(j,V)}catch(i){V(i)}finally{e!==null&&s.types!==null&&(e.types=s.types),p.T=e}},n.unstable_useCacheRefresh=function(){return p.H.useCacheRefresh()},n.use=function(t){return p.H.use(t)},n.useActionState=function(t,e,s){return p.H.useActionState(t,e,s)},n.useCallback=function(t,e){return p.H.useCallback(t,e)},n.useContext=function(t){return p.H.useContext(t)},n.useDebugValue=function(){},n.useDeferredValue=function(t,e){return p.H.useDeferredValue(t,e)},n.useEffect=function(t,e){return p.H.useEffect(t,e)},n.useEffectEvent=function(t){return p.H.useEffectEvent(t)},n.useId=function(){return p.H.useId()},n.useImperativeHandle=function(t,e,s){return p.H.useImperativeHandle(t,e,s)},n.useInsertionEffect=function(t,e){return p.H.useInsertionEffect(t,e)},n.useLayoutEffect=function(t,e){return p.H.useLayoutEffect(t,e)},n.useMemo=function(t,e){return p.H.useMemo(t,e)},n.useOptimistic=function(t,e){return p.H.useOptimistic(t,e)},n.useReducer=function(t,e,s){return p.H.useReducer(t,e,s)},n.useRef=function(t){return p.H.useRef(t)},n.useState=function(t){return p.H.useState(t)},n.useSyncExternalStore=function(t,e,s){return p.H.useSyncExternalStore(t,e,s)},n.useTransition=function(){return p.H.useTransition()},n.version="19.2.4",n}var K;function ct(){return K||(K=1,P.exports=at()),P.exports}var E=ct();const A=st(E),Qt=rt({__proto__:null,default:A},[E]);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ut=o=>o.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),it=o=>o.replace(/^([A-Z])|[\s-_]+(\w)/g,(a,f,l)=>l?l.toUpperCase():f.toLowerCase()),W=o=>{const a=it(o);return a.charAt(0).toUpperCase()+a.slice(1)},X=(...o)=>o.filter((a,f,l)=>!!a&&a.trim()!==""&&l.indexOf(a)===f).join(" ").trim(),ft=o=>{for(const a in o)if(a.startsWith("aria-")||a==="role"||a==="title")return!0};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var pt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yt=E.forwardRef(({color:o="currentColor",size:a=24,strokeWidth:f=2,absoluteStrokeWidth:l,className:d="",children:_,iconNode:b,...m},R)=>E.createElement("svg",{ref:R,...pt,width:a,height:a,stroke:o,strokeWidth:l?Number(f)*24/Number(a):f,className:X("lucide",d),...!_&&!ft(m)&&{"aria-hidden":"true"},...m},[...b.map(([k,g])=>E.createElement(k,g)),...Array.isArray(_)?_:[_]]));/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=(o,a)=>{const f=E.forwardRef(({className:l,...d},_)=>E.createElement(yt,{ref:_,iconNode:a,className:X(`lucide-${ut(W(o))}`,`lucide-${o}`,l),...d}));return f.displayName=W(o),f};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lt=[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]],Xt=c("activity",lt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dt=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],Jt=c("arrow-left",dt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],Ft=c("arrow-right",ht);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _t=[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]],te=c("book-open",_t);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kt=[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]],ee=c("bot",kt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vt=[["path",{d:"M12 18V5",key:"adv99a"}],["path",{d:"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4",key:"1e3is1"}],["path",{d:"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",key:"1gqd8o"}],["path",{d:"M17.997 5.125a4 4 0 0 1 2.526 5.77",key:"iwvgf7"}],["path",{d:"M18 18a4 4 0 0 0 2-7.464",key:"efp6ie"}],["path",{d:"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",key:"1gq6am"}],["path",{d:"M6 18a4 4 0 0 1-2-7.464",key:"k1g0md"}],["path",{d:"M6.003 5.125a4 4 0 0 0-2.526 5.77",key:"q97ue3"}]],oe=c("brain",vt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mt=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],ne=c("check",mt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],re=c("circle-check",gt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],se=c("circle-question-mark",Mt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Et=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["rect",{x:"9",y:"9",width:"6",height:"6",rx:"1",key:"1ssd4o"}]],ae=c("circle-stop",Et);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wt=[["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193",key:"yfwify"}],["path",{d:"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07",key:"jlfiyv"}]],ce=c("cloud-off",wt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]],ue=c("crown",Ct);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=[["path",{d:"M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",key:"9m4mmf"}],["path",{d:"m2.5 21.5 1.4-1.4",key:"17g3f0"}],["path",{d:"m20.1 3.9 1.4-1.4",key:"1qn309"}],["path",{d:"M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",key:"1t2c92"}],["path",{d:"m9.6 14.4 4.8-4.8",key:"6umqxw"}]],ie=c("dumbbell",Rt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const At=[["path",{d:"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",key:"mvr1a0"}],["path",{d:"M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",key:"auskq0"}]],fe=c("heart-pulse",At);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bt=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],pe=c("layout-dashboard",bt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xt=[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]],ye=c("lightbulb",xt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],le=c("lock",Tt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $t=[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]],de=c("log-in",$t);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],he=c("log-out",St);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]],_e=c("message-circle",Nt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=[["path",{d:"m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12",key:"80a601"}],["path",{d:"M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5",key:"j0ngtp"}],["circle",{cx:"16",cy:"7",r:"5",key:"d08jfb"}]],ke=c("mic-vocal",jt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ht=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["rect",{x:"9",y:"2",width:"6",height:"13",rx:"3",key:"s6n7sd"}]],ve=c("mic",Ht);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],me=c("refresh-cw",Ot);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lt=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],ge=c("send",Lt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pt=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Me=c("settings",Pt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qt=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]],Ee=c("shield-alert",qt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],we=c("sparkles",zt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const It=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],Ce=c("star",It);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=[["line",{x1:"10",x2:"14",y1:"2",y2:"2",key:"14vaq8"}],["line",{x1:"12",x2:"15",y1:"14",y2:"11",key:"17fdiu"}],["circle",{cx:"12",cy:"14",r:"8",key:"1e1u0o"}]],Re=c("timer",Yt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dt=[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],Ae=c("trash-2",Dt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],be=c("triangle-alert",Ut);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=[["path",{d:"M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978",key:"1n3hpd"}],["path",{d:"M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978",key:"rfe1zi"}],["path",{d:"M18 9h1.5a1 1 0 0 0 0-5H18",key:"7xy6bh"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z",key:"1mhfuq"}],["path",{d:"M6 9H4.5a1 1 0 0 1 0-5H6",key:"tex48p"}]],xe=c("trophy",Bt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vt=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Te=c("x",Vt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],$e=c("zap",Zt),G=o=>{let a;const f=new Set,l=(k,g)=>{const M=typeof k=="function"?k(a):k;if(!Object.is(M,a)){const x=a;a=g??(typeof M!="object"||M===null)?M:Object.assign({},a,M),f.forEach($=>$(a,x))}},d=()=>a,m={setState:l,getState:d,getInitialState:()=>R,subscribe:k=>(f.add(k),()=>f.delete(k))},R=a=o(l,d,m);return m},Kt=(o=>o?G(o):G),Wt=o=>o;function Gt(o,a=Wt){const f=A.useSyncExternalStore(o.subscribe,A.useCallback(()=>a(o.getState()),[o,a]),A.useCallback(()=>a(o.getInitialState()),[o,a]));return A.useDebugValue(f),f}const Q=o=>{const a=Kt(o),f=l=>Gt(a,l);return Object.assign(f,a),f},Se=(o=>o?Q(o):Q);export{Xt as A,te as B,ce as C,ie as D,Ae as E,Ee as F,fe as H,pe as L,_e as M,A as R,Me as S,Re as T,Te as X,$e as Z,ct as a,ve as b,Se as c,we as d,Ce as e,de as f,be as g,me as h,ue as i,se as j,ke as k,Ft as l,ye as m,Jt as n,le as o,ae as p,ee as q,E as r,oe as s,ge as t,re as u,st as v,Qt as w,ne as x,xe as y,he as z};
