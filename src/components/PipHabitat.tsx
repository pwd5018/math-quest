import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import * as T from "three";
import { places, type PipPlace } from "../lib/pipPlay";

/** Small local paint-like texture; no image downloads and one allocation per habitat. */
function paintedTexture(bark: boolean) {
  const size = 128,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const grain = (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
      const streak = Math.sin(x * 0.65 + Math.sin(y * 0.1) * 0.6);
      const value = Math.round(
        bark
          ? 222 + streak * 19 + grain * 8
          : 244 + grain * 9 + Math.sin(x * 0.12) * Math.cos(y * 0.17) * 3,
      );
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  const texture = new T.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(bark ? 3 : 5, bark ? 1 : 5);
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = T.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function StudioLight() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const room = new RoomEnvironment(),
      generator = new T.PMREMGenerator(gl);
    const environment = generator.fromScene(room, 0.04);
    const previous = scene.environment;
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.38;
    room.dispose();
    generator.dispose();
    return () => {
      scene.environment = previous;
      environment.dispose();
    };
  }, [gl, scene]);
  return null;
}
function Pebble({
  position,
  scale = 1,
  color = "#a4aaa1",
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <mesh
      position={position}
      scale={[scale, scale * 0.6, scale * 0.8]}
      castShadow
      receiveShadow
    >
      <icosahedronGeometry args={[0.25, 2]} />
      <meshStandardMaterial color={color} roughness={0.86} />
    </mesh>
  );
}
function Flower({ x, z, i }: { x: number; z: number; i: number }) {
  return (
    <group position={[x, 0.02, z]} scale={1 + (i % 3) * 0.22}>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.018, 0.026, 0.34, 6]} />
        <meshStandardMaterial color="#497e51" />
      </mesh>
      <mesh
        position={[0.07, 0.15, 0]}
        rotation={[0, 0, -0.8]}
        scale={[0.12, 0.035, 0.055]}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#6f9f56" />
      </mesh>
      {Array.from({ length: 5 }, (_, j) => (
        <mesh
          key={j}
          position={[
            Math.cos(j * 1.257) * 0.1,
            0.35,
            Math.sin(j * 1.257) * 0.1,
          ]}
          scale={[0.09, 0.035, 0.065]}
          rotation={[0, -j * 1.257, 0]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial
            color={["#ffdb8e", "#f4bad0", "#e7ddfb"][i % 3]}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.37, 0]}>
        <sphereGeometry args={[0.055, 12, 8]} />
        <meshStandardMaterial color="#e4a641" />
      </mesh>
    </group>
  );
}
function Meadow({ moon = false }: { moon?: boolean }) {
  const ref = useRef<T.InstancedMesh>(null);
  useEffect(() => {
    const object = new T.Object3D(),
      color = new T.Color();
    for (let i = 0; i < 160; i++) {
      const a = i * 2.39996,
        r = 2.5 + ((i % 13) / 13) * 2;
      object.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
      object.rotation.set(0, a, Math.sin(i) * 0.25);
      object.scale.set(0.035 + (i % 3) * 0.012, 0.1 + (i % 5) * 0.027, 0.035);
      object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix);
      ref.current!.setColorAt(
        i,
        color.set(
          moon
            ? ["#8e95ac", "#c4c8d3"][i % 2]
            : ["#6e9d61", "#93b66b", "#52816a"][i % 3],
        ),
      );
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
  }, [moon]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 160]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  );
}
function Lantern({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.055, 1.7, 10]} />
        <meshStandardMaterial color="#77523d" />
      </mesh>
      <mesh position={[0.16, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.4, 8]} />
        <meshStandardMaterial color="#77523d" />
      </mesh>
      <mesh position={[0.32, 1.28, 0]} scale={[0.16, 0.23, 0.16]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshPhysicalMaterial
          color="#ffe2a1"
          roughness={0.5}
          emissive="#ffb347"
          emissiveIntensity={0.55}
        />
      </mesh>
      <mesh position={[0.32, 1.51, 0]}>
        <coneGeometry args={[0.18, 0.12, 16]} />
        <meshStandardMaterial color="#806347" />
      </mesh>
    </group>
  );
}
function Woodland() {
  const bark = useMemo(() => paintedTexture(true), []);
  useEffect(() => () => bark.dispose(), [bark]);
  const stream = useMemo(() => {
    const shape = new T.Shape();
    shape.moveTo(2, -3.6);
    shape.bezierCurveTo(3.7, -2.7, 1.7, -1, 3, 0.5);
    shape.bezierCurveTo(4.4, 2, 2.5, 3.5, 2, 4);
    shape.lineTo(3.1, 3.7);
    shape.bezierCurveTo(4.8, 2.3, 4.3, 0.8, 3.7, -0.2);
    shape.bezierCurveTo(2.8, -1.6, 4, -2.7, 2.9, -3.6);
    shape.closePath();
    return new T.ShapeGeometry(shape, 32);
  }, []);
  useEffect(() => () => stream.dispose(), [stream]);
  return (
    <>
      <group position={[-2.15, 0, -2.05]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.75, 1.1, 2.4, 20]} />
          <meshStandardMaterial color="#a17a55" roughness={0.95} map={bark} />
        </mesh>
        {[-1, 0, 1].map((i) => (
          <mesh
            key={i}
            position={[i * 0.63, 2.9 + (i === 0 ? 0.4 : 0), -0.12]}
            scale={[1.1, 0.8, 0.95]}
            castShadow
          >
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial
              color={i === 0 ? "#7d9d63" : "#547f65"}
              roughness={0.9}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.65, 0.94]} scale={[0.45, 0.66, 0.1]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshStandardMaterial color="#493e35" />
        </mesh>
        <mesh position={[0, 0.52, 1.04]} scale={[0.32, 0.5, 0.06]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color="#7e9d82" />
        </mesh>
        <mesh position={[0.17, 0.52, 1.11]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshPhysicalMaterial
            color="#dfb655"
            metalness={0.65}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[-0.52, 1.48, 0.68]}>
          <torusGeometry args={[0.23, 0.045, 10, 32]} />
          <meshStandardMaterial color="#e7cc93" />
        </mesh>
        <mesh position={[-0.52, 1.48, 0.67]}>
          <circleGeometry args={[0.22, 32]} />
          <meshStandardMaterial
            color="#ffd88f"
            emissive="#ffc267"
            emissiveIntensity={0.35}
          />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[0.05, 0.055 + i * 0.015, 1.3 + i * 0.32]}
            scale={[0.6, 0.08, 0.22]}
            receiveShadow
          >
            <sphereGeometry args={[1, 16, 8]} />
            <meshStandardMaterial color="#c6b7a0" />
          </mesh>
        ))}
      </group>
      <mesh
        geometry={stream}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.035, 0]}
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#6ebcb6"
          roughness={0.25}
          clearcoat={0.65}
          metalness={0.08}
        />
      </mesh>
      <group position={[3.05, 0.16, 0.3]} rotation={[0, 0.2, 0]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh
            key={i}
            position={[(i - 3) * 0.21, Math.cos((i - 3) * 0.3) * 0.15, 0]}
            castShadow
          >
            <boxGeometry args={[0.19, 0.12, 0.8]} />
            <meshStandardMaterial color={i % 2 ? "#be9568" : "#a77c54"} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[0, 0.44, s * 0.39]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.04, 0.04, 1.7, 8]} />
            <meshStandardMaterial color="#7e6045" />
          </mesh>
        ))}
      </group>
      <Lantern x={-3.6} z={-0.3} />
      <Lantern x={1.6} z={-2.7} />
      {Array.from({ length: 20 }, (_, i) => (
        <Flower
          key={i}
          x={Math.sin(i * 2.4) * (2.5 + (i % 3) * 0.5)}
          z={Math.cos(i * 2.4) * (2.7 + (i % 3) * 0.4)}
          i={i}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <Pebble
          key={i}
          position={[3.3 + Math.sin(i) * 0.45, 0.08, -2.5 + i * 0.47]}
          scale={0.5 + (i % 3) * 0.25}
        />
      ))}
    </>
  );
}
function Mushroom({
  x,
  z,
  size,
  color,
}: {
  x: number;
  z: number;
  size: number;
  color: string;
}) {
  return (
    <group position={[x, 0, z]} scale={size}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.25, 1, 16]} />
        <meshStandardMaterial color="#eddbbb" />
      </mesh>
      <mesh position={[0, 1.05, 0]} scale={[1, 0.45, 1]} castShadow>
        <sphereGeometry args={[0.8, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.36}
          clearcoat={0.25}
          emissive={color}
          emissiveIntensity={0.13}
        />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[Math.cos(i * 1.8) * 0.49, 1.33, Math.sin(i * 1.8) * 0.49]}
          scale={[0.12, 0.035, 0.1]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#fff2d6" />
        </mesh>
      ))}
    </group>
  );
}
function Atmospherics({ place, moving }: { place: PipPlace; moving: boolean }) {
  const group = useRef<T.Group>(null),
    age = useRef(0);
  useFrame((_, d) => {
    if (!moving || !group.current) return;
    age.current += Math.min(d, 0.05);
    group.current.children.forEach((object, i) => {
      const t = age.current;
      object.position.set(
        Math.sin(i * 2.4 + (place === "rain" ? 0 : t * 0.13)) * 4,
        place === "rain"
          ? 4 - ((t * 2 + i * 0.31) % 4)
          : 1.2 + Math.sin(i + t * 0.6) * 0.7 + (i % 3) * 0.6,
        Math.cos(i * 1.7) * 3,
      );
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: place === "rain" ? 55 : 18 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 2.4) * 4,
            1.2 + (i % 3),
            Math.cos(i * 1.7) * 3,
          ]}
          scale={place === "rain" ? [0.012, 0.1, 0.012] : [0.025, 0.025, 0.025]}
        >
          <sphereGeometry args={[1, 6, 4]} />
          <meshBasicMaterial
            color={
              place === "rain"
                ? "#cce7ec"
                : place === "magic"
                  ? "#ffdf95"
                  : "#e7f4cf"
            }
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
export function PipHabitat({
  place,
  moving,
  aiming,
  onThrow,
  onBubbles,
}: {
  place: PipPlace;
  moving: boolean;
  aiming: boolean;
  onThrow: (x: number, z: number) => void;
  onBubbles: () => void;
}) {
  const p = places[place];
  const groundPaint = useMemo(() => paintedTexture(false), []);
  useEffect(() => () => groundPaint.dispose(), [groundPaint]);
  return (
    <>
      <color attach="background" args={[p.sky]} />
      <fog attach="fog" args={[p.sky, 15, 32]} />
      <StudioLight />
      <hemisphereLight args={["#fff0dc", p.ground, 1.15]} />
      <directionalLight
        position={[-3, 7, 5]}
        intensity={2.3}
        color="#fff0db"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[3, 4, -3]} color="#b9daed" intensity={1.4} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (aiming && e.delta <= 6) onThrow(e.point.x, e.point.z);
        }}
      >
        <circleGeometry args={[4.9, 96]} />
        <meshStandardMaterial
          color={p.ground}
          roughness={0.95}
          map={groundPaint}
        />
      </mesh>
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <cylinderGeometry args={[4.9, 4.65, 0.43, 96]} />
        <meshStandardMaterial
          color={place === "moon" ? "#656f8e" : "#5f8779"}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[0, -0.47, 0]}>
        <cylinderGeometry args={[4.65, 4.1, 0.15, 96]} />
        <meshStandardMaterial
          color={place === "moon" ? "#464d70" : "#496e65"}
        />
      </mesh>
      <Meadow moon={place === "moon"} />
      {place === "woodland" && <Woodland />}
      {place === "magic" && (
        <>
          <Mushroom x={-2.5} z={-1.5} size={2.1} color="#b16cc7" />
          <Mushroom x={2.4} z={-2.2} size={1.4} color="#6ec8b7" />
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 3.2, 0, 0.8]}>
              <Mushroom x={0} z={0} size={0.65} color="#e6a4b9" />
              <Lantern x={s * 0.35} z={-0.6} />
            </group>
          ))}
          <mesh position={[0, 2.5, -3]}>
            <torusGeometry args={[1.1, 0.09, 12, 64]} />
            <meshPhysicalMaterial
              color="#cfb0f5"
              emissive="#9972db"
              emissiveIntensity={0.45}
              metalness={0.25}
              roughness={0.35}
            />
          </mesh>
          <Atmospherics place={place} moving={moving} />
        </>
      )}
      {place === "rain" && (
        <>
          <group position={[-2.3, 0, -1.9]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.65, 0.85, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.08, 1.7, 12]} />
                <meshStandardMaterial color="#826d54" />
              </mesh>
            ))}
            <mesh
              position={[0, 1.95, 0]}
              scale={[1.4, 0.3, 1]}
              rotation={[0, 0, -0.15]}
              castShadow
            >
              <sphereGeometry
                args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]}
              />
              <meshPhysicalMaterial
                color="#619476"
                roughness={0.38}
                clearcoat={0.4}
                side={T.DoubleSide}
              />
            </mesh>
          </group>
          {[0, 1, 2].map((i) => (
            <group
              key={i}
              position={[
                i === 0 ? 2.5 : -2.2 + i * 0.7,
                0.04,
                i === 0 ? 1.5 : 2.2,
              ]}
            >
              <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.65, 1]}>
                <circleGeometry args={[0.65 + i * 0.12, 48]} />
                <meshPhysicalMaterial
                  color="#7db5c6"
                  clearcoat={1}
                  roughness={0.12}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
                <torusGeometry args={[0.4, 0.012, 6, 40]} />
                <meshBasicMaterial color="#c4e3df" />
              </mesh>
            </group>
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <Flower
              key={i}
              i={i}
              x={Math.sin(i * 2) * 3.5}
              z={Math.cos(i * 2) * 3}
            />
          ))}
          <Atmospherics place={place} moving={moving} />
        </>
      )}
      {place === "moon" && (
        <>
          <group position={[-2.45, 0, -1.9]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[1, 1.1, 0.5, 32]} />
              <meshStandardMaterial color="#b9bcd0" />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <sphereGeometry
                args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]}
              />
              <meshPhysicalMaterial
                color="#a0bcd4"
                roughness={0.2}
                clearcoat={1}
                metalness={0.25}
              />
            </mesh>
            <mesh position={[0, 0.5, 1]}>
              <torusGeometry args={[0.35, 0.07, 12, 32]} />
              <meshStandardMaterial color="#f5d888" />
            </mesh>
          </group>
          <mesh position={[2.8, 4, -6]}>
            <sphereGeometry args={[0.85, 32, 24]} />
            <meshStandardMaterial
              color="#76a6d2"
              emissive="#467397"
              emissiveIntensity={0.35}
              roughness={0.8}
            />
            <mesh scale={[1, 0.45, 1.02]} rotation={[0, 0, 0.5]}>
              <sphereGeometry args={[0.85, 24, 16]} />
              <meshStandardMaterial color="#a1c9a2" />
            </mesh>
          </mesh>
          {Array.from({ length: 7 }, (_, i) => (
            <group
              key={i}
              position={[
                Math.sin(i * 2.4) * 3.6,
                0.03,
                Math.cos(i * 2.4) * 3.2,
              ]}
            >
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.25 + (i % 3) * 0.12, 0.055, 8, 32]} />
                <meshStandardMaterial color="#6e7895" />
              </mesh>
              <Pebble position={[0.4, 0.06, 0.1]} scale={0.5} color="#b3b9cb" />
            </group>
          ))}
          <Atmospherics place={place} moving={false} />
        </>
      )}
      <group
        position={[-1.7, 0.04, 1.6]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta <= 6) onBubbles();
        }}
      >
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.44, 24]} />
          <meshPhysicalMaterial
            color="#a4c4b5"
            clearcoat={0.55}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.035, 8, 24]} />
          <meshStandardMaterial color="#e0b46f" />
        </mesh>
      </group>
      {aiming && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.4, 0.055, 0.6]}>
          <ringGeometry args={[0.27, 0.32, 40]} />
          <meshBasicMaterial color="#fff0a8" side={T.DoubleSide} />
        </mesh>
      )}
    </>
  );
}
