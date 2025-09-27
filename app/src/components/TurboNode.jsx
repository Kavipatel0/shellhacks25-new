import React from 'react';
import { Handle, Position } from '@xyflow/react';

const TurboNode = ({ data, isConnectable }) => {
  return (
    <div className="turbo-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-turbo-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-turbo-500 text-white">
          {data.icon}
        </div>
        <div>
          <div className="text-lg font-bold text-turbo-500">{data.title}</div>
          {data.subtitle && (
            <div className="text-sm text-gray-500">{data.subtitle}</div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-turbo-500 !border-2 !border-white"
      />
    </div>
  );
};

export default TurboNode;