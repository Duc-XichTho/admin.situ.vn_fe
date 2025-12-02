import './index.css'
import 'react-toastify/dist/ReactToastify.css';
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom'
import { StyledEngineProvider } from "@mui/material/styles";
import App from './App.jsx'
import { LicenseManager } from "ag-grid-enterprise";
import { AgCharts as AgChartsEnterprise } from "ag-charts-enterprise";
import { registerLicense } from '@syncfusion/ej2-base';
import { MyProvider } from "./MyContext.jsx";

registerLicense(import.meta.env.VITE_SYNCFUSION_KEY);

LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_KEY);
AgChartsEnterprise.setLicenseKey(import.meta.env.VITE_AG_GRID_KEY);

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <StyledEngineProvider injectFirst>
            <MyProvider>
                <App />
                <ToastContainer />
            </MyProvider>
        </StyledEngineProvider>
    </BrowserRouter>
)
