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
  const sectionHeight = canvasHeight * ((pages - 1) / (sections - 1));
  const aspect = size.height / viewportHeight;
  return {
    aspect,
    viewport,
    offset,
    viewportWidth,
    viewportHeight,
    canvasWidth,
    canvasHeight,
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

const ModelWithText = ({ domContent, children, bgColor, positionY, modelColor }) => {
  const ref = useRef();

  const [active, setActive] = useState(false);
  const [refItem, inView] = useInView({ threshold: 0 });

  useFrame(() => (ref.current.rotation.y += 0.01));
  useEffect(() => inView && (document.body.style.background = bgColor), [inView]);

  return (
    <Section factor={1.5} offset={1}>
      <group position={[0, positionY, 0]}>
        <mesh ref={ref} position={[0, -28, 0]} scale={active ? 1.4 : 1}>
          <Drifter color={modelColor} />
        </mesh>
        <Html fullscreen portal={domContent}>
          <div ref={refItem} className="container" onClick={() => setActive(!active)}>
            <h1 className="title">{children}</h1>
          </div>
        </Html>
      </group>
    </Section>
  );
};

const Header = () => {
  return (
    <header>
      <div className="header-inner">
        <div className="logo">CARS</div>
        <nav>
          <ul>
            <li>
              <a href="/">these</a>
            </li>
            <li>
              <a href="/">links</a>
            </li>
            <li>
              <a href="/">do</a>
            </li>
            <li>
              <a href="/">nothing</a>
            </li>
            <li className="btn">
              <a href="/">lol</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

function App() {
  const [events] = useState();
  const domContent = useRef();
  const scrollArea = useRef();

  const handleScroll = (e) => (state.top.current = e.target.scrollTop);

  useEffect(() => void handleScroll({ target: scrollArea.current }), []);

  return (
    <>
      <Header />
      <Canvas concurrent colorManagement camera={{ position: [0, 0, 120], fov: 70 }}>
        <Lights />
        <Suspense fallback={null}>
          <ModelWithText domContent={domContent} bgColor="#f15946" modelColor="#636567" positionY={250}>
            <span>Hello.</span>
          </ModelWithText>
          <ModelWithText domContent={domContent} bgColor="#571ec1" modelColor="#f15946" positionY={0}>
            <span>Cars are great right?</span>
          </ModelWithText>
          <ModelWithText domContent={domContent} bgColor="#FCD1D1" modelColor="#571ec1" positionY={-250}>
            <span>All hail cars!</span>
          </ModelWithText>
        </Suspense>
      </Canvas>
      <div ref={scrollArea} onScroll={handleScroll} className="scroll-area" {...events}>
        <div style={{ position: 'sticky', top: 0 }} ref={domContent} />
        <div style={{ height: `${state.pages * 100}vh` }} />
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
