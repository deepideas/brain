
function createSubgeomMaterial(parameters) {
    var material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.common,
            THREE.UniformsLib.specularmap,
            THREE.UniformsLib.envmap,
            THREE.UniformsLib.aomap,
            THREE.UniformsLib.lightmap,
            THREE.UniformsLib.emissivemap,
            THREE.UniformsLib.bumpmap,
            THREE.UniformsLib.normalmap,
            THREE.UniformsLib.displacementmap,
            THREE.UniformsLib.gradientmap,
            THREE.UniformsLib.fog,
            THREE.UniformsLib.lights,
            {
                emissive: { value: new THREE.Color( 0x000000 ) },
                specular: { value: new THREE.Color( 0x111111 ) },
                shininess: { value: 30 }
            }
        ]),
        vertexShader: document.getElementById('vertexShader').text,
        fragmentShader: document.getElementById('fragmentShader').text,


        //vertexShader: THREE.ShaderChunk.meshphong_vert,
        //fragmentShader: THREE.ShaderChunk.meshphong_frag,

        transparent: true,
        lights: true
    });

    material.type = 'SubgeomMaterial';

    material.color = new THREE.Color( 0xffffff ); // diffuse
    material.specular = new THREE.Color( 0x111111 );
    material.shininess = 30;

    material.map = null;

    material.lightMap = null;
    material.lightMapIntensity = 1.0;

    material.aoMap = null;
    material.aoMapIntensity = 1.0;

    material.emissive = new THREE.Color( 0x000000 );
    material.emissiveIntensity = 1.0;
    material.emissiveMap = null;

    material.bumpMap = null;
    material.bumpScale = 1;

    material.normalMap = null;
    material.normalScale = new THREE.Vector2( 1, 1 );

    material.displacementMap = null;
    material.displacementScale = 1;
    material.displacementBias = 0;

    material.specularMap = null;

    material.alphaMap = null;

    material.envMap = null;
    material.combine = THREE.MultiplyOperation;
    material.reflectivity = 1;
    material.refractionRatio = 0.98;

    material.wireframe = false;
    material.wireframeLinewidth = 1;
    material.wireframeLinecap = 'round';
    material.wireframeLinejoin = 'round';

    material.skinning = false;
    material.morphTargets = false;
    material.morphNormals = false;

    material.isMeshPhongMaterial = true;
    //material.clipping = true;

    material.setValues(parameters);

    return material;
}
