// threeImports.js - A centralized place to import and re-export Three.js modules
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

// Import Three.js extensions
import { EffectComposer } from 'https://unpkg.com/three@0.157.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.157.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.157.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.157.0/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'https://unpkg.com/three@0.157.0/examples/jsm/shaders/CopyShader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.157.0/examples/jsm/loaders/GLTFLoader.js';

// Export all of these modules
export {
	THREE,
	EffectComposer,
	RenderPass,
	UnrealBloomPass,
	ShaderPass,
	CopyShader,
	OrbitControls,
	GLTFLoader,
};
