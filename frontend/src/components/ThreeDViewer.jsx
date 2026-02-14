import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Text, Grid, Environment } from '@react-three/drei';

const RoomMesh = ({ position, args, color, name }) => {
    return (
        <group position={position}>
            {/* Floor/Volume */}
            <Box args={args} position={[0, args[1] / 2, 0]}>
                <meshStandardMaterial color={color} opacity={0.8} transparent />
            </Box>
            {/* Wireframe for edges */}
            <Box args={args} position={[0, args[1] / 2, 0]}>
                <meshStandardMaterial wireframe color="white" />
            </Box>
            {/* Label floating above */}
            <Text
                position={[0, args[1] + 0.5, 0]}
                fontSize={0.5}
                color="black"
                anchorX="center"
                anchorY="middle"
            >
                {name}
            </Text>
        </group>
    );
};

const ThreeDViewer = ({ layout }) => {
    if (!layout) return null;

    // Simple auto-layout for 3D visualization
    // We will place rooms in a grid or line for now since we don't have a sophisticated floorplan packer yet
    // This visualizes the *volume* of the rooms.

    let currentX = 0;

    return (
        <div className="h-full w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl overflow-hidden relative">
            <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <Environment preset="city" />

                <group position={[0, -1, 0]}>
                    <Grid infiniteGrid fadeDistance={50} sectionColor="#4f4f4f" cellColor="#888" />

                    {layout.rooms.map((room, idx) => {
                        const width = room.width_ft / 3.28; // convert ft to meters approx for scale
                        const length = room.length_ft / 3.28;
                        const height = 3; // 3 meters height

                        const posX = currentX;
                        currentX += width + 0.5; // gap

                        return (
                            <RoomMesh
                                key={idx}
                                position={[posX - (layout.rooms.length * 2), 0, 0]} // Center roughly
                                args={[width, height, length]}
                                color={room.color}
                                name={room.name}
                            />
                        )
                    })}
                </group>

                <OrbitControls autoRotate autoRotateSpeed={0.5} />
            </Canvas>
            <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded text-xs">
                <p><strong>Left Click:</strong> Rotate</p>
                <p><strong>Scroll:</strong> Zoom</p>
                <p><strong>Right Click:</strong> Pan</p>
            </div>
        </div>
    );
};

export default ThreeDViewer;
