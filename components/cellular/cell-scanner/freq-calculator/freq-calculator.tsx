import FrequencyCalculator from "./calculator";

const FrequencyCalculatorComponent = () => {
  return (
    <div className="@container/main mx-auto p-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">频率计算器</h1>
        <p className="text-muted-foreground">
          在 LTE / 5G NR 下换算 EARFCN、NR-ARFCN、频率与频段。
        </p>
      </div>
      <FrequencyCalculator />
    </div>
  );
};

export default FrequencyCalculatorComponent;
