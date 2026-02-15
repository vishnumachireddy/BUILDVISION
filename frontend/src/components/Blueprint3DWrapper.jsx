import React from 'react';

const Blueprint3DWrapper = ({ numFloors = 1 }) => {
    console.log("Blueprint3DWrapper Rendering - numFloors:", numFloors);
    const cacheBuster = React.useMemo(() => Date.now(), [numFloors]);

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 200px)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            background: '#fff'
        }}>
            <iframe
                src={`/blueprint3d/example/index.html?floors=${numFloors}&v=${cacheBuster}`}
                title="Blueprint 3D Editor"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                }}
            />
        </div>
    );
};

export default Blueprint3DWrapper;
