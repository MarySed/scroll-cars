import React, { createContext, createRef, Suspense, useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useInView } from 'react-intersection-observer';
import lerp from 'lerp';
import Drifter from './Drifter';
import './styles.scss';

const state = {
  sections: 3,
  pages: 3,
  zoom: 1,
  top: createRef()
};

const offsetContext = createContext(0);

const useSection = () => {
  const { sections, pages, zoom } = state;
  const { size, viewport } = useThree();

  const offset = useContext(offsetContext);
  const viewportWidth = viewport.width;
  const viewportHeight = viewport.height;

  const canvasWidth = viewportWidth / zoom;
  const canvasHeight = viewportHeight / zoom;

  const isMobile = size.width < 700;
  const margin = canvasWidth * (isMobile ? 0.2 : 0.1);
  const contentMaxWidth = canvasWidth * (isMobile ? 0.8 : 0.6);
  const sectionHeight = canvasWidth * ((pages - 1) / (sections - 1));

  const aspect = size.height / viewportHeight;

  return {
    aspect,
    viewport,
    offset,
    viewportHeight,
    viewportWidth,
    canvasHeight,
    canvasWidth,
    isMobile,
    margin,
    contentMaxWidth,
    sectionHeight
  };
};

const Section = ({ children, offset, factor, ...props }) => {
  const { offset: parentOffset, sectionHeight, aspect } = useSection();
  const ref = useRef();

  offset = offset ?? parentOffset;

  useFrame(() => {
    const curY = ref.current.position.y;
    const curTop = state.top.current / aspect;
    ref.current.position.y = lerp(curY, (curTop / state.zoom) * factor, 0.1);
  });

  return (
    <offsetContext.Provider value={offset}>
      <group {...props} position={[0, -sectionHeight * offset * factor, 0]}>
        <group ref={ref}>{children}</group>
      </group>
    </offsetContext.Provider>
  );
};

const Lights = () => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight
        castShadow
        position={[0, 10, 0]}
        intensity={1.5}
        shadowMapHeight={1024}
        shadowMapWidth={1024}
        shadowCameraFar={50}
        shadowCameraLeft={-10}
        shadowCameraRight={10}
        shadowCameraTop={10}
        shadowCameraBottom={-10}
      />

      <spotLight intensity={1} position={[1000, 0, 0]} castShadow />
    </>
  );
};

const ModelWithNotation = ({ domContent, children, bgColor, position, modelColor }) => {
  const ref = useRef();
  const { isMobile } = useSection();

  useFrame(() => (ref.current.rotation.y += 0.01));

  const [refItem, inView] = useInView({ threshold: 0 });

  useEffect(() => {
    inView && (document.body.style.background = bgColor);
  }, [inView]);

  return (
    <Section factor={1.5} offset={isMobile ? 1 : 0.5}>
      <group position={[0, position, 0]}>
        <mesh ref={ref} position={[0, -35, 0]}>
          <Drifter color={modelColor} />
        </mesh>
        <Html fullscreen portal={domContent}>
          <div ref={refItem} className="container">
            <h1 className="title">{children}</h1>
          </div>
        </Html>
      </group>
    </Section>
  );
};

function App() {
  const [events] = useState();
  const domContent = useRef();
  const scrollArea = useRef();

  const handleScroll = (e) => (state.top.current = e.target.scrollTop);

  useEffect(() => handleScroll({ target: scrollArea.current }), []);

  return (
    <>
      <Canvas concurrent colorManagement camera={{ position: [0, 0, 120], fov: 70 }}>
        <Lights />
        <Suspense fallback={null}>
          <ModelWithNotation domContent={domContent} bgColor="#f15946" modelColor="#636567" position={250}>
            <span>Test 1</span>
          </ModelWithNotation>
          <ModelWithNotation domContent={domContent} bgColor="#571ec1" modelColor="#f15946" position={0}>
            <span>Test 2</span>
          </ModelWithNotation>
          <ModelWithNotation domContent={domContent} bgColor="#636567" modelColor="#571ec1" position={-250}>
            <span>Test 3</span>
          </ModelWithNotation>
        </Suspense>
      </Canvas>
      <div ref={scrollArea} onScroll={handleScroll} className="scroll-area" {...events}>
        <div style={{ position: 'sticky', top: 0 }} ref={domContent} />
        <div style={{ height: `${state.pages * 100}vh` }} />{' '}
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
