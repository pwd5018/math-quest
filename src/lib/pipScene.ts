import * as T from "three";
import { accentColors, type Appearance } from "./appearance";
import { packForOutfit } from "./packs";

/** Original, articulated mesh character. No remote models, textures or services. */
export function createPipScene(look: Appearance) {
  const scene = new T.Scene();
  const rig = new T.Group();
  scene.add(rig);
  const materials: T.Material[] = [];
  const geometries = new Set<T.BufferGeometry>();
  const mat = (color: string, roughness = 0.72, metalness = 0) => {
    const m = new T.MeshPhysicalMaterial({
      color,
      roughness,
      metalness,
      sheen: metalness ? 0 : 0.45,
      sheenRoughness: 0.75,
      sheenColor: "#fff2df",
      clearcoat: roughness < 0.4 ? 0.32 : 0,
      clearcoatRoughness: 0.2,
    });
    materials.push(m);
    return m;
  };
  const fur = mat("#dd7d32"),
    cream = mat("#fff0d2"),
    dark = mat("#392a25"),
    pink = mat("#d99a87"),
    accent = mat(accentColors[look.accent]);
  const cloth = mat(
    (
      {
        explorer: "#667c4c",
        wizard: "#665289",
        astronaut: "#e3e8e4",
        raincoat: "#e6b639",
      } as Record<string, string>
    )[look.outfit] ??
      (
        {
          halloween: "#744d91",
          enchanted: "#548d76",
          cosmic: "#657cb0",
          ocean: "#3c889b",
          cozy: "#c68c70",
          winter: "#86a9be",
        } as Record<string, string>
      )[packForOutfit(look.outfit)?.id ?? ""] ??
      "#667c4c",
  );
  const white = mat("#fffaf1", 0.35),
    iris = mat("#513523", 0.25),
    black = mat("#161c20", 0.22),
    gold = mat("#ddb35b", 0.32, 0.55);
  const sphere = new T.SphereGeometry(1, 28, 20);
  geometries.add(sphere);
  function mesh(
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    material: T.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    geometries.add(geometry);
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function oval(
    parent: T.Object3D,
    material: T.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    const m = mesh(parent, sphere, material, x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  }
  function tube(
    parent: T.Object3D,
    points: number[][],
    radius: number,
    material: T.Material,
  ) {
    return mesh(
      parent,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(
          points.map((p) => new T.Vector3(...(p as [number, number, number]))),
        ),
        24,
        radius,
        8,
        false,
      ),
      material,
    );
  }
  // Soft jacket, belly and boots. Shoulder pivots articulate the paws in true 3D.
  oval(rig, cloth, 0, 1.05, 0, 0.54, 0.68, 0.39);
  const belly = oval(rig, cream, 0, 1.05, 0.325, 0.34, 0.45, 0.12);
  belly.userData.bodyPart = "belly";
  const legs = [-1, 1].map((side) => {
    const leg = new T.Group();
    leg.position.set(side * 0.29, 0.48, 0);
    rig.add(leg);
    oval(leg, dark, 0, -0.24, 0.13, 0.235, 0.22, 0.33);
    oval(leg, accent, 0, -0.11, 0.06, 0.21, 0.1, 0.24);
    return leg;
  });
  const leftArm = new T.Group(),
    rightArm = new T.Group();
  leftArm.position.set(-0.48, 1.43, 0);
  rightArm.position.set(0.48, 1.43, 0);
  rig.add(leftArm, rightArm);
  for (const arm of [leftArm, rightArm]) {
    arm.userData.bodyPart = "paw";
    oval(arm, cloth, 0, -0.22, 0, 0.18, 0.33, 0.19);
    oval(arm, dark, 0, -0.5, 0.04, 0.17, 0.19, 0.19);
  }
  // A curved, tapered tail, with a separate cream tip that remains visible from behind.
  const tail = new T.Group();
  tail.userData.bodyPart = "tail";
  tail.position.set(0.35, 0.6, -0.2);
  rig.add(tail);
  const tailCurve = new T.CatmullRomCurve3([
    new T.Vector3(0, 0, 0),
    new T.Vector3(0.55, 0.07, -0.36),
    new T.Vector3(0.88, 0.55, -0.35),
    new T.Vector3(0.62, 1.04, -0.15),
  ]);
  for (let part = 0; part < 2; part++) {
    const positions: number[] = [],
      indices: number[] = [];
    const rings = 24,
      sides = 16;
    for (let r = 0; r <= rings; r++) {
      const t = (part === 0 ? 0 : 0.7) + (r / rings) * (part === 0 ? 0.7 : 0.3);
      const center = tailCurve.getPoint(t),
        tangent = tailCurve.getTangent(t);
      const normal = new T.Vector3(0, 0, 1).cross(tangent).normalize(),
        binormal = new T.Vector3().crossVectors(tangent, normal).normalize();
      const radius = Math.max(
        0.008,
        Math.sin(Math.PI * (t * 0.89 + 0.1)) * 0.27 * (1 - t * 0.35),
      );
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2;
        const p = center
          .clone()
          .addScaledVector(normal, Math.cos(angle) * radius)
          .addScaledVector(binormal, Math.sin(angle) * radius);
        positions.push(p.x, p.y, p.z);
        if (r < rings && j < sides) {
          const a = r * (sides + 1) + j,
            b = a + sides + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    mesh(tail, g, part === 0 ? fur : cream);
  }
  const head = new T.Group();
  head.userData.bodyPart = "head";
  head.position.set(0, 2.03, 0.045);
  rig.add(head);
  const sculpt = new T.SphereGeometry(1, 48, 32);
  const vertices = sculpt.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i),
      y = vertices.getY(i),
      z = vertices.getZ(i);
    const cheek = Math.exp(-Math.pow((y + 0.22) * 3, 2));
    vertices.setXYZ(
      i,
      x * (1 + cheek * 0.085),
      y,
      z + (z > 0 ? cheek * 0.07 : 0),
    );
  }
  sculpt.computeVertexNormals();
  mesh(head, sculpt, fur).scale.set(0.74, 0.63, 0.56);
  // Beveled ears have a real front, back and softly rounded rim.
  const earShape = new T.Shape();
  earShape.moveTo(-0.25, 0);
  earShape.quadraticCurveTo(-0.28, 0.32, -0.15, 0.77);
  earShape.quadraticCurveTo(0.04, 0.7, 0.27, 0.09);
  earShape.quadraticCurveTo(0, -0.05, -0.25, 0);
  const ears: T.Group[] = [];
  for (const side of [-1, 1]) {
    const ear = new T.Group();
    ear.userData.bodyPart = "ear";
    ear.position.set(side * 0.43, 0.38, -0.03);
    ear.rotation.z = -side * 0.19;
    head.add(ear);
    ears.push(ear);
    mesh(
      ear,
      new T.ExtrudeGeometry(earShape, {
        depth: 0.12,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.045,
        bevelThickness: 0.045,
        curveSegments: 12,
      }),
      fur,
    );
    const inner = mesh(
      ear,
      new T.ExtrudeGeometry(earShape, {
        depth: 0.02,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.01,
      }),
      pink,
      0,
      0.08,
      0.16,
    );
    inner.scale.set(0.6, 0.66, 0.7);
  }
  // Cheek fur tufts and a projecting muzzle make the silhouette read as a fox.
  for (const side of [-1, 1]) {
    const cheek = oval(head, cream, side * 0.36, -0.19, 0.37, 0.38, 0.29, 0.27);
    cheek.rotation.z = side * 0.24;
    for (let i = 0; i < 2; i++) {
      const tuft = mesh(
        head,
        new T.ConeGeometry(0.12, 0.28, 12),
        i ? cream : fur,
        side * (0.62 - i * 0.03),
        -0.05 - i * 0.17,
        0.15,
      );
      tuft.rotation.z = -side * (1.1 + i * 0.17);
    }
  }
  oval(head, cream, 0, -0.22, 0.54, 0.29, 0.205, 0.25);
  const nose = oval(head, black, 0, -0.1, 0.765, 0.13, 0.088, 0.09);
  nose.userData.bodyPart = "nose";
  // Generous touch target, attached to the animated head and invisible in every view.
  const touchMaterial = new T.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });
  materials.push(touchMaterial);
  const noseTouch = oval(head, touchMaterial, 0, -0.1, 0.81, 0.17, 0.13, 0.13);
  noseTouch.userData.bodyPart = "nose";
  nose.rotation.z = Math.PI;
  oval(head, white, -0.035, -0.073, 0.837, 0.028, 0.012, 0.008);
  const mouth = new T.Group();
  head.add(mouth);
  tube(
    mouth,
    [
      [-0.19, -0.28, 0.718],
      [-0.09, -0.335, 0.75],
      [0, -0.34, 0.76],
      [0.1, -0.32, 0.75],
      [0.18, -0.27, 0.715],
    ],
    0.014,
    dark,
  );
  tube(
    head,
    [
      [0, -0.17, 0.76],
      [0, -0.25, 0.77],
      [0, -0.34, 0.76],
    ],
    0.012,
    dark,
  );
  const eyes = new T.Group();
  head.add(eyes);
  const pupils: T.Group[] = [];
  const eyeParts: T.Group[] = [];
  const brows: T.Mesh[] = [];
  for (const side of [-1, 1]) {
    const eye = new T.Group();
    eye.userData.bodyPart = "eye";
    eyeParts.push(eye);
    eye.position.set(side * 0.29, 0.105, 0.485);
    eyes.add(eye);
    oval(eye, dark, 0, 0, -0.012, 0.165, 0.215, 0.092);
    oval(eye, white, 0, 0, 0.02, 0.145, 0.192, 0.078);
    const pupil = new T.Group();
    eye.add(pupil);
    pupils.push(pupil);
    oval(pupil, iris, 0, -0.012, 0.078, 0.105, 0.139, 0.048);
    oval(pupil, black, 0, -0.005, 0.11, 0.07, 0.109, 0.027);
    oval(pupil, white, -0.031, 0.058, 0.136, 0.034, 0.046, 0.013);
    oval(pupil, white, 0.033, -0.057, 0.137, 0.016, 0.021, 0.009);
    const brow = tube(
      head,
      [
        [side * 0.17, 0.36, 0.46],
        [side * 0.29, 0.395, 0.45],
        [side * 0.4, 0.35, 0.43],
      ],
      0.032,
      dark,
    );
    brows.push(brow);
  }
  // Scarf, clothing details and detachable accessories are geometry, too.
  mesh(
    rig,
    new T.TorusGeometry(0.29, 0.1, 12, 32),
    accent,
    0,
    1.59,
    0.06,
  ).rotation.x = Math.PI / 2;
  const scarf = oval(rig, accent, 0.17, 1.25, 0.425, 0.105, 0.3, 0.055);
  scarf.rotation.z = -0.22;
  for (const y of [0.83, 1.12])
    oval(rig, gold, -0.12, y, 0.422, 0.036, 0.036, 0.025);
  if (look.outfit === "explorer") {
    oval(rig, cloth, -0.37, 0.94, 0.32, 0.16, 0.17, 0.08);
    tube(
      rig,
      [
        [-0.46, 1.52, 0.23],
        [0, 1.13, 0.45],
        [0.43, 0.75, 0.22],
      ],
      0.032,
      dark,
    );
  }
  if (look.outfit === "wizard") {
    const cape = oval(rig, cloth, 0, 1.05, -0.29, 0.63, 0.7, 0.12);
    cape.rotation.x = -0.13;
    for (const [x, y] of [
      [-0.28, 1.28],
      [0.25, 0.87],
      [-0.24, 0.68],
    ])
      mesh(rig, new T.OctahedronGeometry(0.065), gold, x, y, 0.39);
  }
  if (look.outfit === "astronaut") {
    oval(rig, white, 0, 1.07, 0.43, 0.22, 0.23, 0.07);
    oval(rig, accent, 0, 1.13, 0.5, 0.13, 0.08, 0.025);
    for (const x of [-0.08, 0.03, 0.12])
      oval(rig, gold, x, 0.98, 0.5, 0.023, 0.023, 0.014);
    oval(rig, cloth, 0, 1.2, -0.42, 0.38, 0.43, 0.2);
  }
  if (look.outfit === "raincoat") {
    for (const arm of [leftArm, rightArm])
      oval(arm, accent, 0, -0.36, 0, 0.185, 0.06, 0.195);
  }
  // Costume props are modeled as complete 3D accessories, with distinct silhouettes.
  const costume = look.outfit;
  const color = mat(
    (
      {
        pumpkin: "#e99a32",
        witch: "#67428b",
        ghost: "#f4f0e9",
        vampire: "#8c344c",
        knight: "#a9b9bd",
        dragon: "#55976a",
        fairy: "#bb91c8",
        royal: "#a25e8b",
        robot: "#a1b0b8",
        alien: "#85b575",
        cadet: "#eee4ce",
        comet: "#5e75b2",
        pirate: "#57425b",
        sailor: "#f5eddb",
        diver: "#378b9d",
        merfolk: "#7f9fb7",
        chef: "#faf2df",
        pajamas: "#8e9ac1",
        artist: "#d18e79",
        gardener: "#81a476",
        snowman: "#e4edef",
        elf: "#4e8966",
        reindeer: "#a67d59",
        penguin: "#37485c",
      } as Record<string, string>
    )[costume] ?? "#e9b55d",
  );
  function brim(material: T.Material, y = 0.55) {
    oval(head, material, 0, y, 0.02, 0.68, 0.055, 0.5);
  }
  function coneHat(material: T.Material, height = 0.65) {
    brim(material);
    const hat = mesh(
      head,
      new T.ConeGeometry(0.35, height, 32),
      material,
      0,
      0.59 + height / 2,
      -0.04,
    );
    hat.rotation.z = -0.12;
  }
  function cape(material: T.Material) {
    oval(rig, material, 0, 1.02, -0.31, 0.63, 0.69, 0.17);
  }
  function badge(material: T.Material) {
    mesh(rig, new T.OctahedronGeometry(0.11), material, 0, 1.12, 0.48);
  }
  function wings(material: T.Material) {
    for (const side of [-1, 1]) {
      const wing = oval(
        rig,
        material,
        side * 0.68,
        1.35,
        -0.3,
        0.46,
        0.62,
        0.075,
      );
      wing.rotation.z = -side * 0.4;
    }
  }
  if (costume === "pumpkin") {
    oval(rig, color, 0, 0.95, 0.1, 0.65, 0.6, 0.43);
    for (const x of [-0.4, -0.2, 0.2, 0.4])
      oval(rig, mat("#cd782b"), x, 0.94, 0.45, 0.024, 0.43, 0.018);
    oval(head, color, 0, 0.55, 0, 0.39, 0.13, 0.3);
    mesh(
      head,
      new T.CylinderGeometry(0.055, 0.08, 0.2, 12),
      mat("#658548"),
      0,
      0.72,
      0,
    );
  }
  if (costume === "witch") {
    cape(color);
    coneHat(color, 0.67);
    mesh(head, new T.OctahedronGeometry(0.07), gold, 0, 0.7, 0.32);
  }
  if (costume === "ghost") {
    oval(rig, color, 0, 1.08, 0.08, 0.62, 0.64, 0.44);
    for (let i = 0; i < 5; i++)
      oval(rig, color, (i - 2) * 0.22, 0.59, 0.25, 0.14, 0.18, 0.17);
    oval(head, color, 0, 0.37, -0.14, 0.69, 0.29, 0.48);
  }
  if (costume === "vampire") {
    cape(mat("#362e43"));
    for (const side of [-1, 1]) {
      const collar = mesh(
        rig,
        new T.ConeGeometry(0.23, 0.52, 3),
        color,
        side * 0.28,
        1.56,
        0.07,
      );
      collar.rotation.z = -side * 0.45;
      const fang = mesh(
        head,
        new T.ConeGeometry(0.025, 0.1, 10),
        white,
        side * 0.09,
        -0.3,
        0.77,
      );
      fang.rotation.z = Math.PI;
    }
    badge(color);
  }
  if (costume === "knight") {
    oval(rig, color, 0, 1.11, 0.36, 0.36, 0.43, 0.13);
    badge(gold);
    oval(head, color, 0, 0.5, -0.06, 0.48, 0.16, 0.38);
    mesh(head, new T.ConeGeometry(0.09, 0.25, 12), accent, 0, 0.76, 0);
  }
  if (costume === "dragon") {
    wings(color);
    for (const side of [-1, 1])
      mesh(
        head,
        new T.ConeGeometry(0.09, 0.28, 16),
        cream,
        side * 0.31,
        0.65,
        -0.12,
      );
    for (let i = 0; i < 3; i++)
      mesh(
        rig,
        new T.ConeGeometry(0.1, 0.2, 4),
        color,
        0,
        0.65 + i * 0.28,
        -0.4,
      );
  }
  if (costume === "fairy") {
    wings(mat("#d8c5e6", 0.35));
    oval(head, color, 0, 0.5, 0.02, 0.43, 0.07, 0.34);
    badge(gold);
  }
  if (costume === "royal") {
    cape(color);
    brim(gold, 0.53);
    for (let i = 0; i < 5; i++)
      mesh(
        head,
        new T.ConeGeometry(0.09, 0.24, 4),
        gold,
        Math.sin((i / 5) * 6.28) * 0.31,
        0.7,
        Math.cos((i / 5) * 6.28) * 0.31,
      );
  }
  if (costume === "robot") {
    oval(rig, color, 0, 1.1, 0.36, 0.37, 0.42, 0.14);
    for (const x of [-0.16, 0, 0.16])
      oval(rig, x ? accent : gold, x, 1.15, 0.51, 0.05, 0.05, 0.03);
    tube(
      head,
      [
        [0, 0.48, 0],
        [0, 0.9, 0],
      ],
      0.035,
      color,
    );
    oval(head, gold, 0, 0.93, 0, 0.085, 0.085, 0.085);
  }
  if (costume === "alien") {
    for (const side of [-1, 1]) {
      tube(
        head,
        [
          [side * 0.2, 0.5, 0],
          [side * 0.32, 0.9, 0],
        ],
        0.035,
        color,
      );
      oval(head, color, side * 0.32, 0.91, 0, 0.11, 0.11, 0.11);
    }
    badge(color);
  }
  if (costume === "cadet") {
    oval(head, color, 0, 0.53, 0, 0.44, 0.12, 0.36);
    badge(gold);
    oval(rig, color, 0, 1.05, -0.43, 0.32, 0.38, 0.15);
  }
  if (costume === "comet") {
    cape(color);
    for (let i = 0; i < 3; i++)
      mesh(
        rig,
        new T.OctahedronGeometry(0.065),
        gold,
        (i - 1) * 0.17,
        1.25 - i * 0.15,
        0.44,
      );
    coneHat(color, 0.26);
  }
  if (costume === "pirate") {
    brim(color);
    oval(head, color, 0, 0.62, 0, 0.46, 0.22, 0.22);
    tube(
      head,
      [
        [-0.65, 0.1, 0.3],
        [0, 0.2, 0.55],
        [0.65, 0.1, 0.3],
      ],
      0.035,
      dark,
    );
    oval(head, dark, -0.29, 0.1, 0.61, 0.17, 0.18, 0.04);
    badge(gold);
  }
  if (costume === "sailor") {
    brim(white);
    mesh(head, new T.CylinderGeometry(0.34, 0.36, 0.18, 32), color, 0, 0.64, 0);
    badge(accent);
  }
  if (costume === "diver") {
    for (const side of [-1, 1])
      mesh(
        head,
        new T.TorusGeometry(0.22, 0.045, 10, 32),
        accent,
        side * 0.29,
        0.1,
        0.63,
      );
    tube(
      head,
      [
        [0.58, -0.1, 0.35],
        [0.8, 0.05, 0.35],
        [0.8, 0.7, 0.35],
      ],
      0.065,
      color,
    );
    for (const side of [-1, 1])
      oval(rig, color, side * 0.24, 1.1, -0.48, 0.16, 0.43, 0.17);
  }
  if (costume === "merfolk") {
    cape(color);
    for (const side of [-1, 1]) {
      const fin = mesh(
        rig,
        new T.ConeGeometry(0.24, 0.36, 3),
        accent,
        side * 0.55,
        1.2,
        -0.12,
      );
      fin.rotation.z = -side * 1.1;
    }
    badge(cream);
  }
  if (costume === "chef") {
    mesh(head, new T.CylinderGeometry(0.34, 0.36, 0.22, 32), color, 0, 0.6, 0);
    for (const x of [-0.23, 0, 0.23])
      oval(head, color, x, 0.8, 0, 0.23, 0.2, 0.25);
    oval(rig, color, 0, 0.95, 0.4, 0.36, 0.43, 0.08);
  }
  if (costume === "pajamas") {
    coneHat(color, 0.52);
    oval(head, cream, -0.05, 1.1, -0.04, 0.08, 0.08, 0.08);
    for (const y of [0.72, 0.98, 1.2])
      mesh(rig, new T.OctahedronGeometry(0.055), gold, 0.15, y, 0.42);
  }
  if (costume === "artist") {
    oval(head, color, 0, 0.54, 0, 0.5, 0.12, 0.38);
    oval(head, dark, 0, 0.68, 0, 0.04, 0.06, 0.04);
    for (let i = 0; i < 4; i++)
      oval(
        rig,
        mat(["#c87581", "#e1bf68", "#77a8b7", "#8e80b2"][i]),
        (i % 2 ? 1 : -1) * 0.18,
        0.78 + Math.floor(i / 2) * 0.22,
        0.43,
        0.065,
        0.045,
        0.02,
      );
  }
  if (costume === "gardener") {
    brim(mat("#d5bd82"));
    mesh(head, new T.CylinderGeometry(0.31, 0.35, 0.2, 32), color, 0, 0.65, 0);
    oval(rig, color, 0, 0.93, 0.41, 0.36, 0.43, 0.07);
    badge(gold);
  }
  if (costume === "snowman") {
    oval(rig, color, 0, 0.99, 0.15, 0.61, 0.61, 0.38);
    for (const y of [0.75, 0.95, 1.16])
      oval(rig, dark, 0, y, 0.53, 0.045, 0.045, 0.02);
    brim(dark);
    mesh(head, new T.CylinderGeometry(0.31, 0.33, 0.32, 32), dark, 0, 0.72, 0);
  }
  if (costume === "elf") {
    coneHat(color, 0.58);
    oval(head, mat("#bf655b"), -0.07, 1.1, -0.04, 0.08, 0.08, 0.08);
    badge(gold);
  }
  if (costume === "reindeer") {
    for (const side of [-1, 1]) {
      tube(
        head,
        [
          [side * 0.24, 0.48, -0.04],
          [side * 0.32, 0.9, -0.05],
          [side * 0.5, 1.02, -0.07],
        ],
        0.045,
        mat("#8c684c"),
      );
      tube(
        head,
        [
          [side * 0.3, 0.8, -0.05],
          [side * 0.15, 0.92, -0.05],
        ],
        0.035,
        dark,
      );
    }
    oval(head, mat("#be6659"), 0, -0.1, 0.79, 0.13, 0.095, 0.08);
  }
  if (costume === "penguin") {
    oval(rig, color, 0, 1.03, 0.06, 0.57, 0.64, 0.4);
    oval(rig, cream, 0, 0.98, 0.39, 0.36, 0.43, 0.09);
    for (const side of [-1, 1]) {
      const bow = mesh(
        rig,
        new T.ConeGeometry(0.13, 0.23, 3),
        accent,
        side * 0.11,
        1.5,
        0.39,
      );
      bow.rotation.z = (side * Math.PI) / 2;
    }
  }
  if (look.hat === "cap") {
    oval(head, accent, 0, 0.5, -0.07, 0.52, 0.22, 0.43);
    oval(head, accent, 0, 0.45, 0.39, 0.49, 0.045, 0.26);
  }
  if (look.hat === "crown") {
    mesh(head, new T.CylinderGeometry(0.38, 0.4, 0.15, 32), gold, 0, 0.57, 0);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      mesh(
        head,
        new T.ConeGeometry(0.105, 0.26, 4),
        gold,
        Math.sin(angle) * 0.33,
        0.76,
        Math.cos(angle) * 0.33,
      );
    }
  }
  if (look.hat === "flower") {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      oval(
        head,
        white,
        -0.48 + Math.cos(angle) * 0.105,
        0.49 + Math.sin(angle) * 0.105,
        0.34,
        0.082,
        0.082,
        0.035,
      );
    }
    oval(head, gold, -0.48, 0.49, 0.38, 0.06, 0.06, 0.025);
  }
  if (look.glasses) {
    for (const side of [-1, 1]) {
      mesh(
        head,
        new T.TorusGeometry(0.21, 0.026, 8, 32),
        dark,
        side * 0.29,
        0.105,
        0.6,
      );
    }
    tube(
      head,
      [
        [-0.08, 0.13, 0.62],
        [0, 0.17, 0.65],
        [0.08, 0.13, 0.62],
      ],
      0.022,
      dark,
    );
    tube(
      head,
      [
        [-0.51, 0.13, 0.59],
        [-0.66, 0.14, 0.16],
      ],
      0.022,
      dark,
    );
    tube(
      head,
      [
        [0.51, 0.13, 0.59],
        [0.66, 0.14, 0.16],
      ],
      0.022,
      dark,
    );
  }
  const sparkles = new T.Group();
  scene.add(sparkles);
  for (let i = 0; i < 9; i++) {
    const star = mesh(sparkles, new T.OctahedronGeometry(0.055), gold);
    star.userData.phase = (i / 9) * Math.PI * 2;
  }
  const ground = mesh(
    scene,
    new T.CircleGeometry(1.25, 48),
    new T.ShadowMaterial({ opacity: 0.14 }),
    0,
    0.012,
    0,
  );
  materials.push(ground.material as T.Material);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  const sky = look.sky === "starlight";
  scene.add(new T.HemisphereLight(sky ? "#c9d8ff" : "#fff4de", "#7b876e", 2.7));
  const key = new T.DirectionalLight(
    look.sky === "sunset" ? "#ffd1a0" : "#fff3de",
    3.4,
  );
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -2;
  key.shadow.normalBias = 0.035;
  key.shadow.bias = -0.0002;
  scene.add(key);
  const rim = new T.DirectionalLight(sky ? "#b1baff" : "#d7eaff", 2);
  rim.position.set(3, 3, -4);
  scene.add(rim);
  const camera = new T.PerspectiveCamera(32, 1, 0.1, 30);
  camera.position.set(2.7, 2.65, 6.3);
  camera.lookAt(0, 1.57, 0);
  return {
    scene,
    camera,
    rig,
    head,
    ears,
    eyes,
    pupils,
    eyeParts,
    brows,
    nose,
    mouth,
    leftArm,
    rightArm,
    tail,
    legs,
    sparkles,
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      key.shadow.map?.dispose();
    },
  };
}
