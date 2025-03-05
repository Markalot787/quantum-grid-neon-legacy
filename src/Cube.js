update(delta) {
    console.log('Cube Update:', {
        position: this.mesh.position,
        rotation: this.mesh.rotation,
        delta: delta
    });
    
    // TEMP: Visual position marker
    this.mesh.material.color.setHex(0xFF0000); // Remove after testing
} 