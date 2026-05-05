import FPLMNCard from "./fplmn-card";

const FPLMNSettingsComponent = () => {
  return (
    <div className="@container/main mx-auto p-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">FPLMN 设置</h1>
        <p className="text-muted-foreground">
          查看并清除 SIM 卡上的禁止运营商列表。
        </p>
      </div>
      <div className="grid grid-cols-1 @3xl/main:grid-cols-2 grid-flow-row gap-4">
        <FPLMNCard />
      </div>
    </div>
  );
};

export default FPLMNSettingsComponent;
