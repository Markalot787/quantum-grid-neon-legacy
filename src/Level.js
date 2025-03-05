createPlatform() {
    console.log('Platform Creation:', {
        position: this.platformMesh.position,
        material: this.platformMesh.material
    });
    // Add temporary highlight
    this.platformMesh.material.wireframe = true; // Remove after testing
} 