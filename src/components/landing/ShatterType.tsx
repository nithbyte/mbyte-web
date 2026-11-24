// @ts-nocheck
"use client";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
} from "react";
import * as THREE from "three";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ShatterTypeRef {
  shatter: (x?: number, y?: number) => void;
  assemble: () => void;
}

export interface ShatterTypeProps {
  text?: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  align?: "center" | "left" | "right";
  colors?: string[];
  accentColor?: string;
  shardSize?: number;
  irregularity?: number;
  crack?: number;
  crackRadius?: number;
  heal?: number;
  shatter?: boolean;
  shatterRadius?: number;
  force?: number;
  spin?: number;
  depth?: number;
  gravity?: number;
  reassemble?: number;
  stiffness?: number;
  glint?: number;
  intro?: "assemble" | "none";
  introDuration?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  interactive?: boolean;
  paused?: boolean;
  quality?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

let c=1/120,d=`
uniform sampler2D uState;
uniform vec2 uStateSize;
attribute vec3 center;
attribute vec3 bary;
attribute float shard;
varying vec2 vUv;
varying vec3 vBary;
varying vec3 vNormal;
varying float vCrack;
varying float vFlash;
varying float vAlpha;
varying float vOrigin;

vec4 fetchState(float k) {
  float column = mod(shard, 256.0) * 3.0 + k;
  float row = floor(shard / 256.0);
  return texture2D(uState, (vec2(column, row) + 0.5) / uStateSize);
}

vec3 rotateQ(vec4 q, vec3 v) {
  vec3 t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}

void main() {
  vec4 motion = fetchState(0.0);
  vec4 turn = fetchState(1.0);
  vec4 extra = fetchState(2.0);
  vec3 world = center + motion.xyz + rotateQ(turn, position * motion.w);
  vNormal = rotateQ(turn, vec3(0.0, 0.0, 1.0));
  vUv = uv;
  vBary = bary;
  vCrack = extra.x;
  vFlash = extra.y;
  vAlpha = extra.z;
  vOrigin = center.x + position.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
}
`,f=`
uniform sampler2D uMask;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uAccent;
uniform vec2 uBounds;
uniform float uGlint;
varying vec2 vUv;
varying vec3 vBary;
varying vec3 vNormal;
varying float vCrack;
varying float vFlash;
varying float vAlpha;
varying float vOrigin;

void main() {
  float mask = texture2D(uMask, vUv).a;
  float alpha = mask * vAlpha;
  if (alpha < 0.004) discard;
  vec3 n = normalize(vNormal);
  bool front = gl_FrontFacing;
  vec3 facing = front ? n : -n;
  float t = clamp((vOrigin - uBounds.x) / max(1.0, uBounds.y - uBounds.x), 0.0, 1.0);
  vec3 base = front ? mix(uColorA, uColorB, t) : uAccent;
  vec3 light = normalize(vec3(-0.45, 0.62, 0.64));
  float shade = 1.0 + 0.6 * (dot(facing, light) - light.z);
  vec3 bounce = reflect(-light, facing);
  float tilt = smoothstep(0.0, 0.3, 1.0 - facing.z);
  float spark = pow(max(bounce.z, 0.0), 26.0) * tilt * uGlint;
  float edge = min(min(vBary.x, vBary.y), vBary.z);
  float seam = 1.0 - smoothstep(0.0, fwidth(edge) * 1.5, edge);
  vec3 colour = base * clamp(shade, 0.35, 1.4);
  colour = mix(colour, vec3(1.0), clamp(spark + seam * vCrack * 0.3 + vFlash * 0.5, 0.0, 1.0));
  gl_FragColor = vec4(colour, alpha);
}
`,m=(e,t,a)=>Math.min(a,Math.max(t,e)),p=(e,t)=>Number.isFinite(e)?e:t,y=(e,t,a)=>{let r=m((a-e)/(t-e),0,1);return r*r*(3-2*r)},v=e=>{let t=e>>>0;return()=>{let e=t=t+0x6d2b79f5>>>0;return e=Math.imul(e^e>>>15,1|e),(((e^=e+Math.imul(e^e>>>7,61|e))^e>>>14)>>>0)/0x100000000}},g=null,w=e=>{if(typeof window==="undefined")return()=>{};let t=window.matchMedia("(prefers-reduced-motion: reduce)");return t.addEventListener("change",e),()=>t.removeEventListener("change",e)},b=()=>typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,x=forwardRef(function({text:e="Shatter",fontFamily:t="",fontWeight:a=700,fontSize:i=0,letterSpacing:l=-.02,lineHeight:o=1.05,align:x="center",colors:F=["currentColor","currentColor"],accentColor:M="#7B5CFF",shardSize:S=.09,irregularity:A=.6,crack:C=.6,crackRadius:k=.5,heal:E=.9,shatter:j=!0,shatterRadius:B=.55,force:R=1,spin:z=1,depth:I=1,gravity:T=0,reassemble:L=1.1,stiffness:P=.55,glint:D=.8,intro:U="assemble",introDuration:H=1.6,autoplay:N=!1,autoplayInterval:W=4,interactive:G=!0,paused:q=!1,quality:Y=1,className:$,style:O,children:Q},X){let _=useRef(null),V=useRef(null),K={text:e,fontFamily:t,fontWeight:a,fontSize:i,letterSpacing:l,lineHeight:o,align:x,colors:F,accentColor:M,shardSize:S,irregularity:A,crack:C,crackRadius:k,heal:E,shatter:j,shatterRadius:B,force:R,spin:z,depth:I,gravity:T,reassemble:L,stiffness:P,glint:D,intro:U,introDuration:H,autoplay:N,autoplayInterval:W,interactive:G,paused:q,quality:Y,reduced:useSyncExternalStore(w,b,()=>!1)},Z=useRef(K);
  useEffect(()=>{Z.current=K,V.current?.sync()});
  useEffect(()=>{let e=_.current;if(!e)return;let t=((e,t)=>{let a,r=e.ownerDocument,n=r.createElement("canvas");n.setAttribute("aria-hidden","true"),n.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none",e.insertBefore(n,e.firstChild);try{a=new THREE.WebGLRenderer({canvas:n,alpha:!0,premultipliedAlpha:!0,antialias:!0})}catch{return n.remove(),null}a.setClearColor(0,0);let i=r.defaultView??window,l=i.matchMedia("(pointer: fine)"),o=new THREE.Scene,h=new THREE.PerspectiveCamera(24,1,1,1e4),w=r.createElement("canvas"),b=new THREE.CanvasTexture(w);b.minFilter=THREE.LinearFilter,b.magFilter=THREE.LinearFilter,b.generateMipmaps=!1;let x=new Float32Array(4),F=new THREE.DataTexture(x,1,1,THREE.RGBAFormat,THREE.FloatType),M=new THREE.ShaderMaterial({vertexShader:d,fragmentShader:f,transparent:!0,side:THREE.DoubleSide,depthTest:!0,depthWrite:!0,uniforms:{uState:{value:F},uStateSize:{value:new THREE.Vector2(1,1)},uMask:{value:b},uColorA:{value:new THREE.Color(1,1,1)},uColorB:{value:new THREE.Color(1,1,1)},uAccent:{value:new THREE.Color(.48,.36,1)},uBounds:{value:new THREE.Vector2(0,1)},uGlint:{value:.8}}}),S=new THREE.BufferGeometry,A=new THREE.Mesh(S,M);A.frustumCulled=!1,o.add(A);let C=0,k=0,E=0,j=!1,B=!0,R=!1,z=0,I=0,T=64,L=0,P="",D="",U=1/0,H=0,N=v(5369127),W=new Float32Array(0),G=new Float32Array(0),q=new Float32Array(0),Y=new Float32Array(0),$=new Float32Array(0),O=new Float32Array(0),Q=new Float32Array(0),X=new Float32Array(0),_=new Float32Array(0),V=new Float32Array(0),K=new Float32Array(0),Z=new Float32Array(0),J=new Float32Array(0),ee=new Float32Array(0),et=new Float32Array(0),ea=new Float32Array(0),er=new Float32Array(0),en=new Float32Array(0),ei=new Float32Array(0),el=new Float32Array(0),eo=new Float32Array(0),es=new Float64Array(0),eu=new Float64Array(0),eh=new Uint8Array(0),ec=new Uint8Array(0),ed={x:0,y:0,inside:!1,at:0,speed:0},ef={x:0,y:0,at:0,live:!1},em=()=>{let a=t.current,r="",n=t=>{let a=(t??"").trim();return a&&"currentcolor"!==a.toLowerCase()?a:(r||(r=i.getComputedStyle(e).color),r)},l=Array.isArray(a.colors)?a.colors:[],o=n(l[0]),s=n(l[1]??l[0]),u=n(a.accentColor),h=`${o}|${s}|${u}`;if(h===D)return;D=h;let c=(e,t,a)=>{let r=((e,t)=>{if("undefined"==typeof document||!e||"undefined"!=typeof CSS&&"function"==typeof CSS.supports&&!CSS.supports("color",e))return t;if(!g){let e=document.createElement("canvas");e.width=1,e.height=1,g=e.getContext("2d",{willReadFrequently:!0})}if(!g)return t;g.clearRect(0,0,1,1),g.fillStyle="#000",g.fillStyle=e,g.fillRect(0,0,1,1);let a=g.getImageData(0,0,1,1).data;return{r:a[0],g:a[1],b:a[2]}})(t,a);M.uniforms[e].value.setRGB(r.r/255,r.g/255,r.b/255)};c("uColorA",o,{r:23,g:23,b:23}),c("uColorB",s,{r:23,g:23,b:23}),c("uAccent",u,{r:123,g:92,b:255})},ep=(e,a,r,n)=>{let i=m(p(t.current.introDuration,1.6),.2,6),l=z>0?(W[e]+z/2)/z:.5;if(eh[e]=2,es[e]=r+(.5*l+.14*N())*i*n,O[e]=0,Q[e]=0,X[e]=0,Z[e]=0,J[e]=0,ee[e]=0,ec[e]="drop"===a?3:2,"drop"===a){q[e]=(N()-.5)*T*.4,Y[e]=I*(.55+.45*N())+T,$[e]=N()*T*.6,_[e]=(N()-.5)*1.2,V[e]=(N()-.5)*1.2,K[e]=(N()-.5)*1.6,ei[e]=1;return}if("fade"===a){q[e]=0,Y[e]=0,$[e]=T*(.6+.8*N()),_[e]=(N()-.5)*.5,V[e]=(N()-.5)*.5,K[e]=(N()-.5)*.3,ei[e]=0;return}let o=N()*Math.PI*2,s=(.2+.8*N())*T*1.1;q[e]=Math.cos(o)*s,Y[e]=Math.sin(o)*s*.8,$[e]=T*(.5+1.7*N()),_[e]=(N()-.5)*Math.PI*2,V[e]=(N()-.5)*Math.PI*2,K[e]=(N()-.5)*Math.PI*2,ei[e]=0},ey=e=>{let a=t.current,r=a.reduced?"none":a.intro;for(let t=0;t<L;t++)"none"===r?(eh[t]=0,q[t]=0,Y[t]=0,$[t]=0,_[t]=0,V[t]=0,K[t]=0,ei[t]=1,ec[t]=0):ep(t,r,e,1);let n=m(p(a.introDuration,1.6),.2,6);H="none"===r?e:e+1.1*n,U=e+("none"===r?1.2:n+1.4)},ev=()=>{var r;let n,l=t.current,o=e.getBoundingClientRect(),s=Math.max(1,Math.round(o.width)),c=Math.max(1,Math.round(o.height)),d=Math.min(i.devicePixelRatio||1,2)*m(p(l.quality,1),.5,1),f=(l.fontFamily??"").trim()||i.getComputedStyle(e).fontFamily||"sans-serif",y=[s,c,d,l.text,f,l.fontWeight,l.fontSize,l.letterSpacing,l.lineHeight,l.align,l.shardSize,l.irregularity].join("|");if(y===P)return!1;P=y,z=s,I=c,a.setPixelRatio(d),a.setSize(s,c,!1),h.aspect=s/c,h.position.set(0,0,c/2/Math.tan(24*Math.PI/360)),h.near=1,h.far=4*h.position.z,h.updateProjectionMatrix();let g=String(l.text??"").split("\n"),C=m(Math.round(p(Number(l.fontWeight),700)),100,900),k=p(l.letterSpacing,-.02),E=m(p(l.lineHeight,1.05),.6,3);w.width=Math.max(1,Math.ceil(s*d)),w.height=Math.max(1,Math.ceil(c*d));let j=w.getContext("2d",{willReadFrequently:!0});if(!j)return!1;let B="letterSpacing"in j,D=e=>`${C} ${e}px ${f}`,U=e=>{j.font=D(e),B&&(j.letterSpacing=`${k*e}px`);let t=0;for(let e of g)t=Math.max(t,j.measureText(e).width);return t},ed=p(l.fontSize,0);if(!(ed>0)){ed=Math.min(.42*c,420);for(let e=0;e<60&&(!(U(ed)<=.84*s)||!((g.length-1)*ed*E+1.7*ed<=.60*c));e++)ed*=.95}T=ed=Math.max(6,ed),j.setTransform(1,0,0,1,0,0),j.clearRect(0,0,w.width,w.height),j.setTransform(d,0,0,d,0,0),j.font=D(ed),B&&(j.letterSpacing=`${k*ed}px`),j.fillStyle="#ffffff",j.textBaseline="alphabetic";let em=0.82*ed,ep=1.0*ed;try{let ef0=j.measureText(g[0]||"M");if(ef0.actualBoundingBoxAscent)em=Math.max(em,ef0.actualBoundingBoxAscent);let efLast=j.measureText(g[g.length-1]||"g");if(efLast.actualBoundingBoxDescent)ep=Math.max(ep,efLast.actualBoundingBoxDescent+24)}catch{}let eTot=(g.length-1)*ed*E+em+ep,ev=(c-eTot)/2+em-0.6*ed,eg=1/0,ew=-1/0;for(let e of g){let t=j.measureText(e).width,a="left"===l.align?.07*s:"right"===l.align?.93*s-t:(s-t)/2;j.fillText(e,a,ev),e.trim()&&(eg=Math.min(eg,a),ew=Math.max(ew,a+t)),ev+=ed*E}Number.isFinite(eg)||(eg=0,ew=s),b.dispose(),b.needsUpdate=!0,M.uniforms.uBounds.value.set(eg-s/2,ew-s/2);let eb=j.getImageData(0,0,w.width,w.height).data,ex=w.width,eF=(e,t,a,r,n,i)=>{let l=Math.floor(Math.min(e,a,n)*d),o=Math.ceil(Math.max(e,a,n)*d),s=Math.floor(Math.min(t,r,i)*d),u=Math.ceil(Math.max(t,r,i)*d),h=(a-e)*(i-t)-(n-e)*(r-t);if(1e-6>Math.abs(h))return!1;let c=h>0?1:-1,f=1.2/d;for(let h=Math.max(0,s);h<=Math.min(w.height-1,u);h++){let s=(h+.5)/d;for(let u=Math.max(0,l);u<=Math.min(ex-1,o);u++){if(eb[(h*ex+u)*4+3]<=2)continue;let l=(u+.5)/d,o=((a-e)*(s-t)-(r-t)*(l-e))*c,m=((n-a)*(s-r)-(i-r)*(l-a))*c,p=((e-n)*(s-i)-(t-i)*(l-n))*c,y=Math.hypot(a-e,r-t),v=Math.hypot(n-a,i-r),g=Math.hypot(e-n,t-i);if(o>=-f*y&&m>=-f*v&&p>=-f*g)return!0}}return!1};N=v(5369127);let eM=Math.max(5,m(p(l.shardSize,.09),.03,.4)*ed),eS=m(p(l.irregularity,.6),0,1),eA=eM/2,eC=Math.ceil(s/eA)+1,ek=Math.ceil(c/eA)+1,eE=new Uint8Array(eC*ek),ej=Math.max(0,Math.floor((eg-.2*ed)*d)),eB=Math.min(ex-1,Math.ceil((ew+.2*ed)*d));for(let e=0;e<w.height;e++){let t=e*ex,a=Math.floor(e/d/eA)*eC;for(let e=ej;e<=eB;e++)eb[(t+e)*4+3]>2&&(eE[a+Math.floor(e/d/eA)]=1)}let eR=(e,t)=>{let a=Math.floor(e/eA),r=Math.floor(t/eA);for(let e=-3;e<=3;e++){let t=r+e;if(!(t<0)&&!(t>=ek))for(let e=-3;e<=3;e++){let r=a+e;if(r>=0&&r<eC&&eE[t*eC+r])return!0}}return!1},ez=new Float64Array(3200),eI=new Float64Array(3200),eT=0,eL=.866*eM,eP=0;for(let e=-eM;e<=c+eM&&eT<3200;e+=eL,eP++)for(let t=-eM+(eP%2?eM/2:0);t<=s+eM&&eT<3200;t+=eM){if(N()<.2*eS)continue;let a=t+(N()-.5)*eM*.75*eS,r=e+(N()-.5)*eM*.75*eS;eR(a,r)&&(ez[eT]=a,eI[eT]=r,eT+=1)}let eD=eT>=3?((e,t,a)=>{let r=Array.from({length:a},(e,t)=>t).sort((t,a)=>e[t]-e[a]),n=1/0,i=1/0,l=-1/0,o=-1/0;for(let r=0;r<a;r++)n=Math.min(n,e[r]),i=Math.min(i,t[r]),l=Math.max(l,e[r]),o=Math.max(o,t[r]);let s=20*Math.max(l-n,o-i,1),u=(n+l)/2,h=(i+o)/2,c=new Float64Array(a+3),d=new Float64Array(a+3);c.set(e.subarray(0,a)),d.set(t.subarray(0,a)),c[a]=u-s,d[a]=h-s,c[a+1]=u,d[a+1]=h+s,c[a+2]=u+s,d[a+2]=h-s;let f=(e,t,a)=>{let r=c[e],n=d[e],i=c[t],l=d[t],o=c[a],s=d[a],u=2*(r*(l-s)+i*(s-n)+o*(n-l));if(1e-12>Math.abs(u))return{a:e,b:t,c:a,x:(r+i+o)/3,y:(n+l+s)/3,r:1/0};let h=r*r+n*n,f=i*i+l*l,m=o*o+s*s,p=(h*(l-s)+f*(s-n)+m*(n-l))/u,y=(h*(o-i)+f*(r-o)+m*(i-r))/u;return{a:e,b:t,c:a,x:p,y,r:(r-p)*(r-p)+(n-y)*(n-y)}},m=[f(a,a+1,a+2)],p=[],y=[];for(let e of r){let t=c[e],a=d[e];y.length=0;let r=[];for(let e of m){let n=t-e.x;if(n>0&&n*n>e.r){p.push(e);continue}let i=a-e.y;n*n+i*i<=e.r?y.push(e.a,e.b,e.b,e.c,e.c,e.a):r.push(e)}for(let t=0;t<y.length;t+=2){let a=y[t],n=y[t+1];if(a<0)continue;let i=!1;for(let e=t+2;e<y.length;e+=2)(y[e]===a&&y[e+1]===n||y[e]===n&&y[e+1]===a)&&(y[e]=-1,y[e+1]=-1,i=!0);i||r.push(f(a,n,e))}m=r}let v=[];for(let e of p.concat(m))e.a>=a||e.b>=a||e.c>=a||v.push(e.a,e.b,e.c);return v})(ez,eI,eT):[],eU=[];for(let e=0;e<eD.length;e+=3){let t=eD[e],a=eD[e+1],r=eD[e+2];eF(ez[t],eI[t],ez[a],eI[a],ez[r],eI[r])&&eU.push(t,a,r)}W=new Float32Array(r=L=eU.length/3),G=new Float32Array(r),q=new Float32Array(r),Y=new Float32Array(r),$=new Float32Array(r),O=new Float32Array(r),Q=new Float32Array(r),X=new Float32Array(r),_=new Float32Array(r),V=new Float32Array(r),K=new Float32Array(r),Z=new Float32Array(r),J=new Float32Array(r),ee=new Float32Array(r),et=new Float32Array(r).fill(1),ea=new Float32Array(r),er=new Float32Array(r),en=new Float32Array(r),ei=new Float32Array(r).fill(1),el=new Float32Array(r),eo=new Float32Array(r),es=new Float64Array(r),eu=new Float64Array(r),eh=new Uint8Array(r),ec=new Uint8Array(r),x=new Float32Array(768*(n=Math.max(1,Math.ceil(r/256)))*4),F.dispose(),(F=new THREE.DataTexture(x,768,n,THREE.RGBAFormat,THREE.FloatType)).minFilter=THREE.NearestFilter,F.magFilter=THREE.NearestFilter,F.needsUpdate=!0,M.uniforms.uState.value=F,M.uniforms.uStateSize.value.set(768,n);let eH=new Float32Array(9*L),eN=new Float32Array(9*L),eW=new Float32Array(6*L),eG=new Float32Array(9*L),eq=new Float32Array(3*L);for(let e=0;e<L;e++){let t=eU[3*e],a=eU[3*e+1],r=eU[3*e+2];if((ez[a]-ez[t])*(eI[t]-eI[r])-(ez[r]-ez[t])*(eI[t]-eI[a])<0){let e=t;t=a,a=e}let n=(ez[t]+ez[a]+ez[r])/3,i=(eI[t]+eI[a]+eI[r])/3;W[e]=n-s/2,G[e]=c/2-i;let l=N()*Math.PI*2;el[e]=Math.cos(l),eo[e]=Math.sin(l),[t,a,r].forEach((t,a)=>{let r=9*e+3*a;eH[r]=ez[t]-n,eH[r+1]=i-eI[t],eH[r+2]=0,eN[r]=W[e],eN[r+1]=G[e],eN[r+2]=0,eG[r+a]=1,eW[6*e+2*a]=ez[t]/s,eW[6*e+2*a+1]=1-eI[t]/c,eq[3*e+a]=e})}let eY=new THREE.BufferGeometry;if(eY.setAttribute("position",new THREE.Float32BufferAttribute(eH,3)),eY.setAttribute("center",new THREE.Float32BufferAttribute(eN,3)),eY.setAttribute("uv",new THREE.Float32BufferAttribute(eW,2)),eY.setAttribute("bary",new THREE.Float32BufferAttribute(eG,3)),eY.setAttribute("shard",new THREE.Float32BufferAttribute(eq,1)),S.dispose(),A.geometry=S=eY,R)if(performance.now()/1e3<H)ey(performance.now()/1e3);else for(let e=0;e<L;e++)eh[e]=0,ec[e]=0,ei[e]=1;else for(let e=0;e<L;e++)ei[e]=0,eh[e]=2,es[e]=1/0;return!0},eg=(e,a,r,n=1)=>{let i=t.current;if(!L||i.reduced)return;let l=e-z/2,o=I/2-a,s=m(p(i.shatterRadius,.55),.1,6)*T,u=m(p(i.force,1),0,4)*n,h=m(p(i.spin,1),0,4),c=m(p(i.depth,1),0,4),d=m(p(i.reassemble,1.1),.1,10),f=!1;for(let e=0;e<L;e++){let t=W[e]-l,a=G[e]-o,n=Math.hypot(t,a);if(n>1.6*s)continue;let i=1-y(.6*s,1.3*s,n);if(i<.3||2===eh[e]||1===eh[e]){er[e]=Math.max(er[e],.7*(1-y(s,1.6*s,n)));continue}f=!0;let m=n>.001?t/n:N()-.5,p=n>.001?a/n:N()-.5,v=Math.sqrt(T/160),g=u*(170+380*N())*i*v;eh[e]=1,ec[e]=1,eu[e]=r+.04+n/s*.09,es[e]=eu[e]+d*(.85+.3*N())+n/s*.16,O[e]=m*g+(N()-.5)*70*u*v,Q[e]=p*g+(N()-.5)*70*u*v,X[e]=c*(320+760*N())*i*v,Z[e]=(N()-.5)*2*h*(3+6*N())*i,J[e]=(N()-.5)*2*h*(3+6*N())*i,ee[e]=(N()-.5)*2*h*(1.5+3.5*N())*i,er[e]=.55}f&&ex()},ew=e=>e-2*Math.PI*Math.round(e/(2*Math.PI)),eb=(e,a)=>{let r=t.current,n=5+9*m(p(r.stiffness,.55),0,1),i=7.5/Math.max(.15,.55*m(p(r.introDuration,1.6),.2,6)),l=1500*m(p(r.gravity,0),0,4),o=Math.exp(-(2.6*e)),s=Math.exp(-(.7*e)),u=1/Math.max(.05,p(r.heal,.9)),h=m(p(r.crack,.6),0,1),c=m(p(r.crackRadius,.5),.05,4)*T,d=Math.exp(-Math.max(0,a-ed.at)/.08)*y(40,900,ed.speed),f=ed.inside&&t.current.interactive&&!r.reduced&&h>0&&d>.01,v=ed.x-z/2,g=I/2-ed.y,w=0;for(let t=0;t<L;t++){if(2===eh[t]){if(a<es[t])continue;eh[t]=0}if(1===eh[t])if(a>=es[t])eh[t]=0,_[t]=ew(_[t]),V[t]=ew(V[t]),K[t]=ew(K[t]),O[t]*=.25,Q[t]*=.25,X[t]*=.25;else if(a>=eu[t]){Q[t]-=l*e,O[t]*=o,Q[t]*=o,X[t]*=o,Z[t]*=s,J[t]*=s,ee[t]*=s,q[t]+=O[t]*e,Y[t]+=Q[t]*e,$[t]+=X[t]*e,_[t]+=Z[t]*e,V[t]+=J[t]*e,K[t]+=ee[t]*e,w+=1;continue}else{w+=1;continue}if(f){let e=Math.hypot(W[t]-v,G[t]-g);if(e<c){let a=h*d*Math.pow(1-e/c,1.5);a>er[t]&&(er[t]=a)}}let r=2===ec[t]?i:3===ec[t]?1.25*i:ec[t]?n:18,m=2===ec[t]?1:3===ec[t]?.5:ec[t]?.68:.9,p=r*r,y=2*m*r,b=eo[t]*er[t]*.14,x=-el[t]*er[t]*.14;O[t]+=(-p*q[t]-y*O[t])*e,Q[t]+=(-p*Y[t]-y*Q[t])*e,X[t]+=(-p*$[t]-y*X[t])*e,q[t]+=O[t]*e,Y[t]+=Q[t]*e,$[t]+=X[t]*e,Z[t]+=(-p*(_[t]-b)-y*Z[t])*e,J[t]+=(-p*(V[t]-x)-y*J[t])*e,ee[t]+=(-p*K[t]-y*ee[t])*e,_[t]+=Z[t]*e,V[t]+=J[t]*e,K[t]+=ee[t]*e;let F=1-.025*er[t];ea[t]+=(-324*(et[t]-F)-30*ea[t])*e,et[t]+=ea[t]*e,ei[t]<1&&(ei[t]=Math.min(1,ei[t]+4.5*e)),ec[t]&&Math.abs(q[t])+Math.abs(Y[t])+Math.abs($[t])<1.5&&Math.abs(_[t])+Math.abs(V[t])+Math.abs(K[t])<.06&&(ec[t]=0,en[t]=Math.max(en[t],.9)),er[t]*=Math.exp(-e*u),er[t]<.015&&(er[t]=0),en[t]*=Math.exp(-e/.16),en[t]<.01&&(en[t]=0);let M=Math.abs(q[t])+Math.abs(Y[t])+Math.abs($[t])<.3&&Math.abs(O[t])+Math.abs(Q[t])+Math.abs(X[t])<3&&Math.abs(_[t]-b)+Math.abs(V[t]-x)+Math.abs(K[t])<.004&&Math.abs(Z[t])+Math.abs(J[t])+Math.abs(ee[t])<.06&&8e-4>Math.abs(et[t]-F)&&.02>Math.abs(ea[t]);M&&(q[t]=0,Y[t]=0,$[t]=0,O[t]=0,Q[t]=0,X[t]=0,_[t]=b,V[t]=x,K[t]=0,Z[t]=0,J[t]=0,ee[t]=0,et[t]=F,ea[t]=0,ec[t]&&(ec[t]=0,en[t]=Math.max(en[t],.9)));let S=+!M+er[t]+en[t]+(1-ei[t]);S>.004&&(w+=S)}return w},ex=()=>{j||!B||C||(C=i.requestAnimationFrame(eF))};function eF(e){if(C=0,j)return;let r=t.current,n=E?m((e-E)/1e3,0,.05):1/60;E=e;let l=performance.now()/1e3;if(r.paused){E=0;return}if(r.autoplay&&!r.reduced&&R&&L&&!ed.inside&&l>=U){U=l+m(p(r.autoplayInterval,4),.8,30)*(.85+.3*N());let e=Math.floor(N()*L);eg(W[e]+z/2,I/2-G[e],l,.9)}let s=0,u=n,d=l-n;for(;u>1e-6;){let e=Math.min(c,u);u-=e,d+=e,s=eb(e,d)}M.uniforms.uGlint.value=m(p(r.glint,.8),0,2),(()=>{let e=m(p(t.current.crack,.6),0,1),a=m(p(t.current.glint,.8),0,2);for(let t=0;t<L;t++){let r=(256*Math.floor(t/256)*3+t%256*3)*4;x[r]=q[t],x[r+1]=Y[t],x[r+2]=$[t],x[r+3]=et[t];let n=Math.cos(_[t]/2),i=Math.sin(_[t]/2),l=Math.cos(V[t]/2),o=Math.sin(V[t]/2),s=Math.cos(K[t]/2),u=Math.sin(K[t]/2);x[r+4]=i*l*s+n*o*u,x[r+5]=n*o*s-i*l*u,x[r+6]=n*l*u+i*o*s,x[r+7]=n*l*s-i*o*u,x[r+8]=er[t]*e,x[r+9]=en[t]*a,x[r+10]=ei[t],x[r+11]=0}F.needsUpdate=!0})(),a.render(o,h);let f=!1;for(let e=0;e<L&&!f;e++)2===eh[e]&&es[e]!==1/0&&(f=!0);s>.004||f||ed.inside&&l-ed.at<.2?ex():(k&&(i.clearTimeout(k),k=0),r.autoplay&&!r.reduced&&R&&Number.isFinite(U)&&(k=i.setTimeout(()=>{k=0,ex()},Math.max(16,(U-l)*1e3))))}let eM=(t,a)=>{let r=e.getBoundingClientRect();ed.x=t-r.left,ed.y=a-r.top},eS=e=>{if("touch"===e.pointerType||!t.current.interactive||!l.matches)return;let a=ed.x,r=ed.y,n=performance.now()/1e3,i=Math.max(.008,n-ed.at);eM(e.clientX,e.clientY);let o=ed.inside?Math.hypot(ed.x-a,ed.y-r)/i:0;ed.speed+=(Math.min(o,4e3)-ed.speed)*Math.min(1,i/.05),ed.inside=!0,ed.at=n,ex()},eA=e=>{"touch"!==e.pointerType&&(ed.inside=!1,U=Math.max(U,performance.now()/1e3+1.5),ex())},eC=e=>{let a=t.current;if(a.interactive&&a.shatter){if("touch"===e.pointerType){ef.x=e.clientX,ef.y=e.clientY,ef.at=performance.now()/1e3,ef.live=!0;return}0===e.button&&(eM(e.clientX,e.clientY),eg(ed.x,ed.y,performance.now()/1e3))}},ek=t=>{if("touch"!==t.pointerType||!ef.live||(ef.live=!1,Math.hypot(t.clientX-ef.x,t.clientY-ef.y)>10||performance.now()/1e3-ef.at>.35))return;let a=e.getBoundingClientRect();eg(t.clientX-a.left,t.clientY-a.top,performance.now()/1e3)},eE=()=>{em(),ev(),ex()},ej=new ResizeObserver(()=>eE());ej.observe(e);let eB=new IntersectionObserver(([e])=>{(B=e.isIntersecting)?(E=0,eE(),R||(R=!0,ey(performance.now()/1e3),ex()),ex()):C&&(i.cancelAnimationFrame(C),C=0)},{threshold:.15});eB.observe(e);let eR=()=>{P="",eE()};return r.fonts?.addEventListener?.("loadingdone",eR),r.fonts?.ready?.then(()=>{j||eR()}),e.addEventListener("pointermove",eS,{passive:!0}),e.addEventListener("pointerleave",eA),e.addEventListener("pointerdown",eC,{passive:!0}),i.addEventListener("pointerup",ek,{passive:!0}),em(),ev(),{sync:()=>eE(),shatter:(e,t)=>{if(!L)return;if("number"==typeof e&&"number"==typeof t&&Number.isFinite(e)&&Number.isFinite(t))return void eg(e,t,performance.now()/1e3);let a=Math.floor(N()*L);eg(W[a]+z/2,I/2-G[a],performance.now()/1e3)},assemble:()=>{R=!0,ey(performance.now()/1e3),ex()},destroy:()=>{j=!0,C&&i.cancelAnimationFrame(C),k&&i.clearTimeout(k),ej.disconnect(),eB.disconnect(),r.fonts?.removeEventListener?.("loadingdone",eR),e.removeEventListener("pointermove",eS),e.removeEventListener("pointerleave",eA),e.removeEventListener("pointerdown",eC),i.removeEventListener("pointerup",ek),S.dispose(),M.dispose(),b.dispose(),F.dispose(),a.dispose(),a.forceContextLoss(),n.remove()}}})(e,Z);return V.current=t,()=>{t?.destroy(),V.current=null}}, []);
  useImperativeHandle(X,()=>({shatter:(e,t)=>V.current?.shatter(e,t),assemble:()=>V.current?.assemble()}), []);
  return React.createElement("div",{ref:_,className:cn("relative isolate h-full min-h-[240px] w-full overflow-visible",$),style:O,children:[React.createElement("span",{key:"text-span",style:{position:"absolute",width:1,height:1,margin:-1,padding:0,overflow:"hidden",clip:"rect(0 0 0 0)",whiteSpace:"nowrap",border:0},children:e}),Q&&React.createElement("div",{key:"children-div",className:"relative z-10 h-full w-full",children:Q})]})});x.displayName="ShatterType";

export const ShatterType = x as React.ForwardRefExoticComponent<
  ShatterTypeProps & React.RefAttributes<ShatterTypeRef>
>;
export default ShatterType;
