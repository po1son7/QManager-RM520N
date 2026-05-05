import React from "react";
import ConnectionScenariosCard from "./connection-scenario-card";

const ConnectionScenariosComponent = () => {
  return (
    <div className="@container/main mx-auto p-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">连接场景</h1>
        <p className="text-muted-foreground">
          管理蜂窝连接场景，用于在不同网络环境下优化性能与稳定性。
        </p>
      </div>
        <ConnectionScenariosCard />
    </div>
  );
};

export default ConnectionScenariosComponent;
