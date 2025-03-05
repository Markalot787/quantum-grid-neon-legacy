constructor(game) {
    console.log('Player Initialization:', {
        position: this.mesh.position,
        visible: this.mesh.visible
    });
    
    // TEMP: Make player giant for visibility
    this.mesh.scale.set(2, 2, 2); // Remove after testing
} 