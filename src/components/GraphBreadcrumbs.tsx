
import React, { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { HiChevronRight } from 'react-icons/hi';
import { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

const parseBreadcrumbs = (uri: string | null) => {
    if (!uri) return [];

    // Check if it's a valid URI structure we expect
    // e.g. https://.../schema#/properties/foo/properties/bar
    if (!uri.includes('#')) return [{ label: 'root', id: uri }];

    const [base, fragment] = uri.split('#');
    // fragment starts with / usually
    const parts = fragment.split('/').filter(p => p);

    const breadcrumbs = [{ label: 'root', id: base }];
    let currentFragment = '';

    parts.forEach((part) => {
        currentFragment += `/${part}`;
        breadcrumbs.push({
            label: part,
            id: base + '#' + currentFragment
        });
    });

    return breadcrumbs;
};

const GraphBreadcrumbs = () => {
    const { breadcrumbNodeId, setSelectedNodeId, selectedNodeId } = useContext(AppContext);
    const { fitView, getNodes } = useReactFlow();

    const crumbs = useMemo(() => parseBreadcrumbs(breadcrumbNodeId), [breadcrumbNodeId]);

    const handleClick = (targetId: string) => {
        // Attempt to find the node in the graph
        const node = getNodes().find(n => n.id === targetId);

        if (node) {
            // Move camera AND update selection state (for highlighting)
            // But we do NOT update breadcrumbNodeId, so the trail remains deep/long
            setSelectedNodeId(targetId);
            fitView({ nodes: [{ id: targetId }], duration: 500, padding: 0.5 });
        } else {
            console.log("Node not found in graph view:", targetId);
        }
    };

    if (!breadcrumbNodeId || crumbs.length <= 1) return null;

    return (
        <div className="absolute top-4 left-4 z-50 flex items-center bg-[var(--reactflow-bg-question-color)] px-3 py-1.5 rounded-lg shadow-sm border border-[var(--node-border-color)] bg-white/90 dark:bg-black/80 backdrop-blur-sm text-sm transition-all duration-300">
            {crumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                    {index > 0 && <HiChevronRight className="mx-1 text-gray-400" />}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleClick(crumb.id); }}
                        className={`hover:underline flex items-center transition-colors ${crumb.id === selectedNodeId
                            ? 'font-semibold text-[var(--text-color)]'
                            : 'text-gray-500 hover:text-[var(--text-color)]'
                            }`}
                        title={crumb.id}
                    >
                        {crumb.label}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

export default GraphBreadcrumbs;
