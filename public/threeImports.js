// threeImports.js - Import Three.js as a global variable and expose other modules
// Import Three.js
import * as THREEModule from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

// Make THREE accessible globally
window.THREE = THREEModule;

// Export these for modules that need specific imports
export const THREE = THREEModule;

// Workaround to avoid direct imports from "three" in the extension modules
const EXTENSIONS_BASE_URL =
	'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/';

// Import Three.js extensions
export const EffectComposer = (
	await import(`${EXTENSIONS_BASE_URL}postprocessing/EffectComposer.js`)
).EffectComposer;
export const RenderPass = (
	await import(`${EXTENSIONS_BASE_URL}postprocessing/RenderPass.js`)
).RenderPass;
export const UnrealBloomPass = (
	await import(`${EXTENSIONS_BASE_URL}postprocessing/UnrealBloomPass.js`)
).UnrealBloomPass;
export const ShaderPass = (
	await import(`${EXTENSIONS_BASE_URL}postprocessing/ShaderPass.js`)
).ShaderPass;
export const CopyShader = (
	await import(`${EXTENSIONS_BASE_URL}shaders/CopyShader.js`)
).CopyShader;
export const OrbitControls = (
	await import(`${EXTENSIONS_BASE_URL}controls/OrbitControls.js`)
).OrbitControls;
export const GLTFLoader = (
	await import(`${EXTENSIONS_BASE_URL}loaders/GLTFLoader.js`)
).GLTFLoader;
