/* Homepage hero background.
   - CSS layers (light, bokeh, beams, ribbons, paw trail) always work and move with the mouse/scroll.
   - A Three.js scene (glossy chocolate with reflections, soft shadows, gold sparkles) is added on top
     when the device can handle it. If it can't load, the CSS 3D objects remain visible.
   - Reduced motion: one still frame, no reveal, no movement. */
(function () {
  'use strict';
  var hero = document.getElementById('hero'), bg = document.getElementById('hbg'), canvas = document.getElementById('gl');
  if (!hero || !bg || !canvas) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 800px)').matches;
  var fine = window.matchMedia('(pointer:fine)').matches;
  var conn = navigator.connection || {};

  /* ---- reveal centre = the brand name ---- */
  function revealCentre() {
    var h1 = document.getElementById('h1'); if (!h1) return { x: .28, y: .32 };
    var hb = hero.getBoundingClientRect(), r = h1.getBoundingClientRect();
    var cx = (r.left + Math.min(r.width, 620) / 2) - hb.left, cy = (r.top + r.height / 2) - hb.top;
    bg.style.setProperty('--bx', cx + 'px'); bg.style.setProperty('--by', cy + 'px');
    return { x: cx / hb.width, y: cy / hb.height };
  }
  var centre = revealCentre();

  /* ---- pointer + scroll parallax for the CSS layers ---- */
  var pxv = 0, pyv = 0, ticking = false;
  function layers() {
    ticking = false;
    var sc = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.clientHeight)));
    bg.style.setProperty('--hx', (pxv * 36).toFixed(1));
    bg.style.setProperty('--hy', (pyv * 24 - sc * 60).toFixed(1));
  }
  if (!reduce) {
    if (fine) window.addEventListener('pointermove', function (e) { pxv = e.clientX / innerWidth - .5; pyv = e.clientY / innerHeight - .5; if (!ticking) { ticking = true; requestAnimationFrame(layers); } }, { passive: true });
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(layers); } }, { passive: true });
  }

  /* ---- WebGL scene ---- */
  if (conn.saveData || (navigator.deviceMemory && navigator.deviceMemory < 2)) return;

  function start() {
    var T = window.THREE, r, failed = false;
    try {
      if (!T) return;
      r = new T.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
      var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      r.setPixelRatio(dpr);
      r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
      var shadows = !small; r.shadowMap.enabled = shadows; r.shadowMap.type = T.PCFShadowMap;
      var scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, .1, 60); cam.position.z = 8;

      /* studio reflections: a dark warm environment with soft boxes, so glossy surfaces catch light */
      var ec = document.createElement('canvas'); ec.width = 512; ec.height = 256; var ex = ec.getContext('2d');
      var eg = ex.createLinearGradient(0, 0, 0, 256); eg.addColorStop(0, '#3a2218'); eg.addColorStop(.5, '#1d0f0a'); eg.addColorStop(1, '#0d0605');
      ex.fillStyle = eg; ex.fillRect(0, 0, 512, 256);
      function box(x, y, w, h, col) { var g = ex.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,230,180,.15)'); ex.fillStyle = g; ex.fillRect(x, y, w, h); }
      box(60, 40, 120, 70, 'rgba(255,238,205,.95)'); box(300, 30, 90, 60, 'rgba(255,214,150,.85)'); box(420, 120, 70, 40, 'rgba(214,174,101,.8)'); box(190, 150, 140, 22, 'rgba(255,240,215,.55)');
      var et = new T.CanvasTexture(ec); et.mapping = T.EquirectangularReflectionMapping;
      var pm = new T.PMREMGenerator(r); scene.environment = pm.fromEquirectangular(et).texture; pm.dispose(); et.dispose();

      scene.add(new T.AmbientLight(0x4a2a1c, .5));
      var key = new T.DirectionalLight(0xffe2b0, 1.5); key.position.set(-4, 6, 7); key.target.position.set(0, 0, -4);
      if (shadows) { key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5; key.shadow.camera.left = -10; key.shadow.camera.right = 10; key.shadow.camera.top = 8; key.shadow.camera.bottom = -8; key.shadow.camera.near = .5; key.shadow.camera.far = 30; key.shadow.bias = -.0005; }
      scene.add(key); scene.add(key.target);
      var rim = new T.PointLight(0xd6ae65, 1.8, 24); rim.position.set(5, 2, 3); scene.add(rim);
      var fill = new T.PointLight(0xb97b45, 1.1, 22); fill.position.set(-5, -3, 3); scene.add(fill);
      if (shadows) { var wall = new T.Mesh(new T.PlaneGeometry(50, 36), new T.ShadowMaterial({ opacity: .42 })); wall.position.z = -5; wall.receiveShadow = true; scene.add(wall); }

      function rr(w, h, rad) {
        var s = new T.Shape(), x = -w / 2, y = -h / 2;
        s.moveTo(x + rad, y); s.lineTo(x + w - rad, y); s.quadraticCurveTo(x + w, y, x + w, y + rad);
        s.lineTo(x + w, y + h - rad); s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
        s.lineTo(x + rad, y + h); s.quadraticCurveTo(x, y + h, x, y + h - rad);
        s.lineTo(x, y + rad); s.quadraticCurveTo(x, y, x + rad, y); return s;
      }
      var seg = small ? 2 : 4;
      var gCube = new T.ExtrudeGeometry(rr(1, 1, .14), { depth: .8, bevelEnabled: true, bevelThickness: .08, bevelSize: .07, bevelSegments: seg, curveSegments: 6 });
      var gBar = new T.ExtrudeGeometry(rr(1.5, 1, .14), { depth: .2, bevelEnabled: true, bevelThickness: .06, bevelSize: .05, bevelSegments: seg, curveSegments: 6 });
      var gTile = new T.ExtrudeGeometry(rr(.38, .38, .06), { depth: .04, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 4 });
      var gSph = new T.SphereGeometry(.5, small ? 24 : 40, small ? 18 : 30);
      function phys(col, rough, metal, coat, env) { return new T.MeshPhysicalMaterial({ color: col, roughness: rough, metalness: metal, clearcoat: coat, clearcoatRoughness: .08, envMapIntensity: env }); }
      var mChoc = phys(0x3a1f16, .24, 0, 1, 1.25), mDark = phys(0x2a140d, .3, 0, .8, 1.1), mGold = phys(0xd6ae65, .22, 1, .3, 1.5), mCar = phys(0xb97b45, .32, .05, .7, 1.2);

      function shade(o) { o.traverse(function (m) { if (m.isMesh) { m.castShadow = shadows; } }); return o; }
      function cube(mat) { var g = new T.Group(), m = new T.Mesh(gCube, mat || mChoc); m.position.z = -.4; g.add(m); var t = new T.Mesh(gTile, mDark); t.scale.set(1.5, 1.5, 1); t.position.z = .46; if (mat !== mGold) g.add(t); return shade(g); }
      function bar() { var g = new T.Group(), b = new T.Mesh(gBar, mChoc); b.position.z = -.1; g.add(b);
        for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) { var t = new T.Mesh(gTile, mDark); t.position.set(-.45 + i * .45, -.22 + j * .44, .12); g.add(t); } return shade(g); }
      function ball(mat) { return shade(new T.Mesh(gSph, mat)); }
      function paw(mat) {
        var g = new T.Group(), pad = new T.Mesh(gSph, mat); pad.scale.set(1, .82, .5); pad.position.y = -.14; g.add(pad);
        [[-.56, .3, -.3], [-.2, .62, -.08], [.2, .62, .08], [.56, .3, .3]].forEach(function (p) { var t = new T.Mesh(gSph, mat); t.scale.set(.36, .46, .3); t.position.set(p[0], p[1], 0); t.rotation.z = p[2]; g.add(t); });
        return shade(g);
      }
      var MK = { cubeGold: function () { return cube(mGold); }, cube: function () { return cube(); }, bar: bar, sphere: function () { return ball(mChoc); }, sphereGold: function () { return ball(mGold); }, sphereCar: function () { return ball(mCar); }, paw: function () { return paw(mChoc); }, pawGold: function () { return paw(mGold); } };
      var LAYOUT = small ? [
        ['cubeGold', .9, 2.0, -.8, .7], ['sphere', -.9, -2.2, -.5, .6], ['bar', .8, -1.2, -1.5, .8], ['paw', -.7, 2.4, -2, .6], ['cube', .3, -2.5, -2, .5], ['sphereCar', 1.0, .5, -3, .4]
      ] : [
        ['cubeGold', 3.5, 1.7, .2, .95], ['cube', 1.9, 2.2, -1.5, .6], ['bar', 2.3, -.6, -.3, 1.25], ['sphere', 3.9, -1.5, .6, .8], ['paw', 1.1, -2.0, -1.2, .8], ['sphereGold', 1.3, .9, -2.2, .45],
        ['cube', 3.6, -2.2, -1.8, .55], ['pawGold', 4.0, .2, -2.5, .7], ['sphereCar', 2.7, 2.6, -2.8, .5], ['bar', -3.6, -2.4, -3, .7], ['cube', -1.2, 2.5, -3.2, .45]
      ];
      var group = new T.Group(); scene.add(group); var pieces = [];
      LAYOUT.forEach(function (L, i) {
        var o = MK[L[0]](); o.scale.setScalar(L[4]);
        o.userData = { bx: L[1], by: L[2], bz: L[3], s: L[4], k: (L[3] + 4) / 6, i: i, sx: (Math.random() - .5) * .006, sy: (Math.random() - .5) * .008, ph: Math.random() * 6, amp: .1 + Math.random() * .18, rx: Math.random() * 3, ry: Math.random() * 3, rz: Math.random() * 3 };
        o.rotation.set(o.userData.rx, o.userData.ry, o.userData.rz); group.add(o); pieces.push(o);
      });

      /* gold sparkles: twinkling four-point stars that drift upward */
      var n = small ? 60 : 140, pos = new Float32Array(n * 3), ph = new Float32Array(n), sz = new Float32Array(n), sp = new Float32Array(n);
      for (var q = 0; q < n; q++) { pos[q * 3] = (Math.random() - .5) * 16; pos[q * 3 + 1] = (Math.random() - .5) * 12; pos[q * 3 + 2] = -4 + Math.random() * 6; ph[q] = Math.random() * 6.28; sz[q] = .5 + Math.random() * 1.2; sp[q] = .05 + Math.random() * .12; }
      var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(pos, 3)); sg.setAttribute('aPh', new T.BufferAttribute(ph, 1)); sg.setAttribute('aSz', new T.BufferAttribute(sz, 1)); sg.setAttribute('aSp', new T.BufferAttribute(sp, 1));
      var sm = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uT: { value: 0 }, uS: { value: 1 } },
        vertexShader: 'attribute float aPh;attribute float aSz;attribute float aSp;uniform float uT;uniform float uS;varying float vA;void main(){vec3 p=position;p.y=mod(p.y+6.0+uT*aSp*6.0,12.0)-6.0;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=aSz*uS*(9.0/-mv.z);float t=0.5+0.5*sin(uT*(0.8+aSp*8.0)+aPh);vA=pow(t,3.0)*0.9+0.08;}',
        fragmentShader: 'varying float vA;void main(){vec2 uv=gl_PointCoord-0.5;float d=length(uv);float core=smoothstep(0.5,0.0,d);float cr=max(smoothstep(0.05,0.0,abs(uv.x))*smoothstep(0.5,0.0,abs(uv.y)),smoothstep(0.05,0.0,abs(uv.y))*smoothstep(0.5,0.0,abs(uv.x)));float a=(core*0.7+cr*0.8)*vA;gl_FragColor=vec4(1.0,0.9,0.62,a);}' });
      var sparks = new T.Points(sg, sm); scene.add(sparks);

      var tx = 0, ty = 0, mx = 0, my = 0, run = false, t0 = performance.now(), frames = 0, acc = 0, still = reduce;
      var origin = new T.Vector3();
      function size() {
        var w = hero.clientWidth, h = hero.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
        sm.uniforms.uS.value = h * dpr / 900;
        centre = revealCentre();
        var hh = Math.tan(cam.fov * Math.PI / 360) * cam.position.z, hw = hh * cam.aspect;
        origin.set((centre.x * 2 - 1) * hw, -(centre.y * 2 - 1) * hh, 0);
        var f = small ? 1 : Math.min(1.15, Math.max(.8, cam.aspect / 1.51));
        pieces.forEach(function (o) { o.userData.fx = o.userData.bx * f; });
        if (still) draw(9999);
      }
      function ease(x) { x = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - x, 3); }
      function draw(now) {
        var t = (now - t0) / 1000;
        mx += (tx - mx) * .04; my += (ty - my) * .04;
        var sc = Math.min(1, scrollY / Math.max(1, hero.clientHeight));
        sm.uniforms.uT.value = still ? 3 : t;
        group.position.y = sc * 2.2; group.rotation.y = mx * .35; group.rotation.x = my * .2;
        pieces.forEach(function (o) {
          var u = o.userData, e = still ? 1 : ease((t - 1.0 - u.i * .14) / 1.8);
          var bob = still ? 0 : Math.sin(t * .6 + u.ph) * u.amp;
          o.position.set(origin.x + (u.fx - origin.x) * e + mx * u.k * .6, origin.y + (u.by - origin.y) * e + bob - my * u.k * .35, u.bz * e);
          o.scale.setScalar(Math.max(.001, u.s * e));
          if (!still) { o.rotation.x += u.sx * (1 + sc * 3); o.rotation.y += u.sy * (1 + sc * 3); o.rotation.z = u.rz + Math.sin(t * .4 + u.ph) * .08; }
        });
        r.render(scene, cam);
      }
      function frame(now) {
        if (!run) return; requestAnimationFrame(frame);
        var a = performance.now(); draw(now);
        if (small && frames < 90) { acc += performance.now() - a; if (++frames === 90 && acc / 90 > 14) { dpr = 1; r.setPixelRatio(1); size(); } }
      }
      size(); if (window.ResizeObserver) new ResizeObserver(size).observe(hero);
      if (fine && !reduce) window.addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
      canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); run = false; bg.classList.remove('gl-on'); canvas.style.display = 'none'; });
      draw(performance.now() - 5000 * (still ? 1 : 0));
      bg.classList.add('gl-on');
      if (!still) {
        t0 = performance.now();
        new IntersectionObserver(function (es) { run = es[0].isIntersecting && !document.hidden; if (run) requestAnimationFrame(frame); }).observe(hero);
        document.addEventListener('visibilitychange', function () { if (!document.hidden && !run) { run = true; requestAnimationFrame(frame); } else if (document.hidden) run = false; });
      }
    } catch (err) {
      failed = true; bg.classList.remove('gl-on'); canvas.style.display = 'none';
    }
  }

  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.onload = start; s.onerror = function () { canvas.style.display = 'none'; };
  window.addEventListener('load', function () { document.head.appendChild(s); });
})();
