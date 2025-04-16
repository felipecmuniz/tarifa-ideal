import { useState } from "react";
import Tesseract from "tesseract.js";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale);

export default function App() {
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const extractConsumptionHistory = (text) => {
    const lines = text.split("\n");
    const history = [];
    const regex = /([A-Z]{3}\d{2})\s+(\d{3,4})/g;

    for (const line of lines) {
      let match;
      while ((match = regex.exec(line)) !== null) {
        const month = match[1];
        const kwh = parseInt(match[2], 10);
        history.push({ month, kwh });
      }
    }
    return history.length > 0 ? history : null;
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setFileName(file.name);
    setLoading(true);

    try {
      const result = await Tesseract.recognize(
        file,
        "por",
        {
          logger: (m) => console.log(m),
        }
      );

      const text = result.data.text;

      const history = extractConsumptionHistory(text);

      const simulatedAnalysis = {
        currentTariff: text.includes("Monômia") ? "Convencional Monômia" : "Desconhecida",
        recommendedTariff: "Branca",
        estimatedSavings: 134.75,
        consumptionHistory: history || [],
      };

      setAnalysis(simulatedAnalysis);
    } catch (error) {
      console.error("Erro ao processar OCR:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Tarifa Ideal ⚡</h1>
      <p>Faça o upload da sua conta de energia e descubra a melhor tarifa.</p>
      <input type="file" accept="application/pdf,image/*" onChange={handleUpload} />
      {fileName && <p>Arquivo enviado: <strong>{fileName}</strong></p>}
      {loading && <p style={{ color: 'blue' }}>Analisando o conteúdo do arquivo...</p>}

      {analysis && (
        <div style={{ marginTop: 30 }}>
          <h2>Resultado da Análise</h2>
          <p><strong>Modalidade Atual:</strong> {analysis.currentTariff}</p>
          <p><strong>Melhor Modalidade:</strong> {analysis.recommendedTariff}</p>
          <p><strong>Economia Estimada:</strong> R$ {analysis.estimatedSavings.toFixed(2)}</p>

          <div style={{ marginTop: 20 }}>
            <h3>Histórico de Consumo (kWh)</h3>
            <Bar
              data={{
                labels: analysis.consumptionHistory.map((item) => item.month),
                datasets: [
                  {
                    label: "Consumo kWh",
                    data: analysis.consumptionHistory.map((item) => item.kwh),
                  },
                ],
              }}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}