import React from 'react';

const Blueprint3DWrapper = ({ numFloors = 1, activeFloorIndex = 0 }) => {
    console.log("Blueprint3DWrapper Rendering - numFloors:", numFloors, "activeFloorIndex:", activeFloorIndex);
    const cacheBuster = React.useMemo(() => Date.now(), []); // Only on mount
    const iframeRef = React.useRef(null);

    const initialFloors = React.useMemo(() => numFloors, []);
    const initialActiveFloor = React.useMemo(() => activeFloorIndex, []);

    React.useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_ACTIVE_FLOOR',
                activeFloorIndex: activeFloorIndex
            }, '*');
        }
    }, [activeFloorIndex]);

    React.useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_NUM_FLOORS',
                numFloors: numFloors
            }, '*');
        }
    }, [numFloors]);

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
                ref={iframeRef}
                src={`/blueprint3d/example/index.html?floors=${initialFloors}&activeFloor=${initialActiveFloor}&v=${cacheBuster}`}
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
