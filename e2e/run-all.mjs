import { runFlow01 } from './flow-01-superadmin.mjs';
import { runFlow02 } from './flow-02-admin-overview-header.mjs';
import { runFlow03 } from './flow-03-admin-visits-mtp-dcr.mjs';
import { runFlow04 } from './flow-04-admin-live-tracking.mjs';
import { runFlow05 } from './flow-05-admin-fieldforce-territories.mjs';
import { runFlow06 } from './flow-06-admin-network.mjs';
import { runFlow07 } from './flow-07-admin-commercial.mjs';
import { runFlow08 } from './flow-08-admin-products-samples.mjs';
import { runFlow09 } from './flow-09-admin-engagement-reports.mjs';
import { runFlow10 } from './flow-10-mr-login-tabs-profile.mjs';
import { runFlow11 } from './flow-11-live-tracking-roundtrip.mjs';
import { runFlow12 } from './flow-12-mr-directory-chemist-flow.mjs';
import { runFlow13 } from './flow-13-mr-visits-dcr-mtp.mjs';
import { runFlow14 } from './flow-14-mr-commercial-ops.mjs';
import { runFlow15 } from './flow-15-mr-engagement-settings.mjs';
import { runFlow16 } from './flow-16-chat-realtime.mjs';

const FLOWS = [
  { id: 'Flow 01', name: 'Super Admin (Login, Sidebar, Companies, Field Force, Chat, Settings, Sign Out)', fn: runFlow01 },
  { id: 'Flow 02', name: 'Company Admin Overview & Global Header (Territory, Date, Search, Notifications, Theme)', fn: runFlow02 },
  { id: 'Flow 03', name: 'Company Admin Field Ops (Visits, Tour Plans, DCR)', fn: runFlow03 },
  { id: 'Flow 04', name: 'Company Admin Live MR GPS Tracking (SSE, Leaflet Map, Per-MR Toggle, Live Ping)', fn: runFlow04 },
  { id: 'Flow 05', name: 'Company Admin Field Force, 7-Tab MR Analysis & Territories', fn: runFlow05 },
  { id: 'Flow 06', name: 'Company Admin Customer Network (Doctors, Detail, Purchasing, Pharmacies, Distributors)', fn: runFlow06 },
  { id: 'Flow 07', name: 'Company Admin Commercial (Overview, Orders, Collections, Expenses, Receivables)', fn: runFlow07 },
  { id: 'Flow 08', name: 'Company Admin Products, Cloudinary Visual Aids, 8-Tab Samples & Presence', fn: runFlow08 },
  { id: 'Flow 09', name: 'Company Admin Attendance, Campaigns (Heart day), Training, Surveys, 6-Tab Reports, Chat, Settings', fn: runFlow09 },
  { id: 'Flow 10', name: 'MR Mobile Web Login, 5 Bottom Tabs, Workspace & Profile', fn: runFlow10 },
  { id: 'Flow 11', name: 'Dual-Browser Live GPS Tracking Round-Trip (Admin Toggle ON/OFF <-> MR Mobile Web)', fn: runFlow11 },
  { id: 'Flow 12', name: 'MR Directory (Doctors, Purchasing, Chemists) & Chemist GPS Requirement Gathering Flow', fn: runFlow12 },
  { id: 'Flow 13', name: 'MR Visits, Date Switcher, DCR Summary & Monthly Tour Plan (MTP)', fn: runFlow13 },
  { id: 'Flow 14', name: 'MR Orders, Collections, Expenses, Samples, Products, Cloudinary Visual Aids & Analysis', fn: runFlow14 },
  { id: 'Flow 15', name: 'MR Shift Attendance, Campaigns (Heart day), Training, Surveys & Settings', fn: runFlow15 },
  { id: 'Flow 16', name: 'Dual-Browser Real-Time Chat (Admin Web <-> MR Mobile Web)', fn: runFlow16 },
];

async function main() {
  const startedAt = Date.now();
  const results = [];

  for (const flow of FLOWS) {
    const t0 = Date.now();
    console.log(`\n------------------------------------------------------------`);
    console.log(`RUNNING ${flow.id}: ${flow.name}`);
    console.log(`------------------------------------------------------------`);
    try {
      await flow.fn();
      const dur = ((Date.now() - t0) / 1000).toFixed(1);
      results.push({ id: flow.id, name: flow.name, status: 'PASS', dur });
    } catch (err) {
      const dur = ((Date.now() - t0) / 1000).toFixed(1);
      results.push({ id: flow.id, name: flow.name, status: 'FAIL', dur, err: err?.message || String(err) });
      console.error(`\n!!! ${flow.id} FAILED after ${dur}s !!!\n`, err);
      printSummary(results, startedAt);
      process.exit(1);
    }
  }

  printSummary(results, startedAt);
}

function printSummary(results, startedAt) {
  const totalSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  const passed = results.filter((r) => r.status === 'PASS').length;
  console.log(`\n============================================================`);
  console.log(`MBYTE EXHAUSTIVE DOM E2E SUITE SUMMARY: ${passed}/${FLOWS.length} PASSED (${totalSec}s)`);
  console.log(`============================================================`);
  for (const r of results) {
    console.log(`  [${r.status}] ${r.id} (${r.dur}s) - ${r.name}`);
  }
}

main();
