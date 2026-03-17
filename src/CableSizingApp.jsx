import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
//  REFERENCE DATA  — sourced directly from Cable_Sizing_CalculationsTEST.xlsx
// ═══════════════════════════════════════════════════════════════════

// CHG-005
const CATALOGUE = [
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:1.5,  R_cu:15.50, R_al:23.17, X:0.110, cu_gnd:25,  cu_air:22,  al_gnd:25,  al_air:22  },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:2.5,  R_cu:9.48,  R_al:15.50, X:0.107, cu_gnd:34,  cu_air:30,  al_gnd:34,  al_air:30  },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:4,    R_cu:5.90,  R_al:9.48,  X:0.105, cu_gnd:43,  cu_air:36,  al_gnd:34,  al_air:31  },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:6,    R_cu:3.94,  R_al:5.90,  X:0.103, cu_gnd:54,  cu_air:47,  al_gnd:43,  al_air:50  },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:10,   R_cu:2.34,  R_al:3.94,  X:0.100, cu_gnd:72,  cu_air:62,  al_gnd:57,  al_air:67  },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:16,   R_cu:1.47,  R_al:2.44,  X:0.098, cu_gnd:92,  cu_air:79,  al_gnd:73,  al_air:70  },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:25,   R_cu:0.930, R_al:1.540, X:0.089, cu_gnd:119, cu_air:108, al_gnd:94,  al_air:96  },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:35,   R_cu:0.671, R_al:1.110, X:0.083, cu_gnd:144, cu_air:132, al_gnd:113, al_air:117 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:50,   R_cu:0.495, R_al:0.820, X:0.079, cu_gnd:174, cu_air:162, al_gnd:133, al_air:142 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:70,   R_cu:0.343, R_al:0.567, X:0.075, cu_gnd:210, cu_air:198, al_gnd:164, al_air:179 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:95,   R_cu:0.247, R_al:0.410, X:0.074, cu_gnd:252, cu_air:240, al_gnd:196, al_air:221 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:120,  R_cu:0.196, R_al:0.324, X:0.072, cu_gnd:288, cu_air:276, al_gnd:223, al_air:257 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:150,  R_cu:0.159, R_al:0.264, X:0.072, cu_gnd:324, cu_air:318, al_gnd:249, al_air:292 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:185,  R_cu:0.127, R_al:0.210, X:0.071, cu_gnd:360, cu_air:366, al_gnd:282, al_air:337 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:240,  R_cu:0.098, R_al:0.160, X:0.071, cu_gnd:414, cu_air:426, al_gnd:326, al_air:399 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:300,  R_cu:0.077, R_al:0.128, X:0.070, cu_gnd:462, cu_air:480, al_gnd:367, al_air:455 },
  { make:"POLYCAB", insulation:"XLPE", cores:3.5, size:400,  R_cu:0.062, R_al:0.100, X:0.069, cu_gnd:510, cu_air:546, al_gnd:418, al_air:530 },
];

const AIR_TEMP_DF  = { 25:1.14, 30:1.10, 35:1.04, 40:1.00, 45:0.95, 50:0.90, 55:0.85 };
const GND_TEMP_DF  = { 15:1.12, 20:1.08, 25:1.03, 30:1.00, 35:0.96, 40:0.91, 45:0.87 };
const GROUP_DF_AIR = { 1:1.00, 2:0.85, 3:0.79, 4:0.75, 5:0.70, 6:0.68, 9:0.63, 12:0.60 };
const GROUP_DF_GND = { 1:1.00, 2:0.90, 3:0.85, 4:0.80, 5:0.78, 6:0.75, 9:0.70, 12:0.67 };

const LAYING_METHODS = ["In Air","In Trench","In Duct","Underground"];
const FEEDER_TYPES   = ["DOL","RDOL","SDOL","VFD","Contactor"];
const MATERIALS      = ["AL","CU"];
const VOLTAGES       = [415,1100,3300,6600,11000];
const AIR_TEMPS      = [25,30,35,40,45,50,55];
const GND_TEMPS      = [15,20,25,30,35,40,45];
const GROUP_COUNTS   = [1,2,3,4,5,6,9,12];
const MAKE_OPTS=[{value:"POLYCAB",label:"POLYCAB"},{value:"KEI",label:"KEI (coming soon)",disabled:true},{value:"KEC-RPG",label:"KEC-RPG (coming soon)",disabled:true}];
const INS_OPTS=[{value:"XLPE",label:"XLPE"},{value:"PVC",label:"PVC (coming soon)",disabled:true}];
const CORE_OPTS=[{value:3,label:"3C"},{value:3.5,label:"3.5C"},{value:4,label:"4C"}];

// ═══════════════════════════════════════════════════════════════════
//  CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════════
const sq3 = Math.sqrt(3);

function calcFLC(kw, voltage, eff, pf) {
  if (!kw||!voltage||!eff||!pf) return null;
  return (kw*1000)/(sq3*voltage*eff*pf);
}

function interpGroup(map, n) {
  const ks = Object.keys(map).map(Number).sort((a,b)=>a-b);
  if (n<=ks[0]) return map[ks[0]];
  if (n>=ks[ks.length-1]) return map[ks[ks.length-1]];
  for (let i=0;i<ks.length-1;i++) {
    if (n>=ks[i]&&n<=ks[i+1]) {
      const t=(n-ks[i])/(ks[i+1]-ks[i]);
      return map[ks[i]]+t*(map[ks[i+1]]-map[ks[i]]);
    }
  }
  return 1;
}

function calcDF(airT, gndT, nCables, laying) {
  const fA = AIR_TEMP_DF[airT]??1.0;
  const fG = GND_TEMP_DF[gndT]??1.0;
  const isAir = laying==="In Air";
  const fGrp = interpGroup(isAir?GROUP_DF_AIR:GROUP_DF_GND, nCables);
  const fDep = laying==="In Duct"?0.95:laying==="Underground"?0.91:1.0;
  return { fA, fG, fGrp, fDep, combined:+((fA*fG*fGrp*fDep).toFixed(4)) };
}

// CHG-009
function pickCable(reqRating, material, laying, make="POLYCAB", insulation="XLPE", cores=3.5) {
  const isAir = laying==="In Air";
  const key = material==="CU"?(isAir?"cu_air":"cu_gnd"):(isAir?"al_air":"al_gnd");
  return CATALOGUE.filter(c=>c.make===make&&c.insulation===insulation&&c.cores===cores).find(c=>typeof c[key]==="number"&&c[key]>=reqRating)??null;
}

function calcVD(flc, length, R, X, pf, isRatio, runs) {
  const sinR = Math.sqrt(Math.max(0,1-pf*pf));
  const pf_s = 0.20;
  const sinS = Math.sqrt(Math.max(0,1-pf_s*pf_s));
  return {
    VD_run:   +((flc*length*(R*pf+X*sinR))/(runs*1000)).toFixed(3),
    VD_start: +((flc*isRatio*length*(R*pf_s+X*sinS))/(runs*1000)).toFixed(3),
  };
}

// CHG-010/011
function computeRow(row, proj) {
  const { kw, length, eff, pf, isRatio, laying, numCables, runs, material, voltage, make, insulation, cores, overrideSize } = row;
  const airTemp=proj?.airTemp??50; const gndTemp=proj?.gndTemp??30;
  const flc = calcFLC(kw, voltage, eff/100, pf);
  if (!flc||isNaN(flc)) return {};
  const df = calcDF(airTemp, gndTemp, numCables, laying);
  const reqR = flc/df.combined;
  const cable=overrideSize!=null?(CATALOGUE.find(c=>c.make===make&&c.insulation===insulation&&c.cores===cores&&c.size===overrideSize)??null):pickCable(reqR,material,laying,make,insulation,cores);
  if (!cable) return { flc:+flc.toFixed(2), df:df.combined, dfBreak:df, reqR:+reqR.toFixed(1), noMatch:true };
  const R  = material==="CU"?cable.R_cu:cable.R_al;
  const X  = cable.X;
  const bk = material==="CU"?(laying==="In Air"?"cu_air":"cu_gnd"):(laying==="In Air"?"al_air":"al_gnd");
  const baseA   = cable[bk];
  const deratedA = +(baseA*df.combined*runs).toFixed(2);
  const { VD_run, VD_start } = calcVD(flc, length, R, X, pf, isRatio, runs);
  return {
    flc:+flc.toFixed(2), df:df.combined, dfBreak:df, reqR:+reqR.toFixed(1),
    size:cable.size, baseA, deratedA, R, X,
    VD_run, VD_run_pct:+((VD_run/voltage)*100).toFixed(3),
    VD_start, VD_start_pct:+((VD_start/voltage)*100).toFixed(3),
    isOverride:overrideSize!=null, ok:deratedA>=flc,
  };
}

const FMETA = {
  flc:      { label:"Full Load Current (FLC)",       expr:"FLC = (P × 1000) / (√3 × V × η × PF)",  desc:"3-phase motor current formula. P in kW, V in Volts, η = efficiency (decimal), PF = running power factor. Result in Amperes." },
  df:       { label:"Combined Derating Factor",       expr:"DF = F_airTemp × F_gndTemp × F_group × F_depth", desc:"Product of all individual derating factors per IS-1554 and POLYCAB correction tables. A value of 0.68 means the cable can only carry 68% of its catalogue current rating." },
  reqR:     { label:"Required Rating (per Cable Run)",expr:"I_required = FLC / (Combined DF × Runs)",   desc:"Minimum catalogue current rating needed per parallel run. When multiple runs are used, each cable only carries FLC÷Runs, so the required per-cable rating is lower. The catalogue selects the smallest size that meets this per-run figure." },
  size:     { label:"Selected Cable Size",            expr:"Min size where Catalogue Rating ≥ I_req", desc:"First cable in POLYCAB LT-XLPE 3.5C multicore catalogue that meets or exceeds the required rating for the given conductor and laying method." },
  deratedA: { label:"Derated Current Rating",        expr:"I_derated = Base Rating × DF × Runs",     desc:"Actual usable current capacity for this installation. Must be ≥ FLC for the cable to be adequate per IS-1554." },
  VD_run:   { label:"Running Voltage Drop (V)",       expr:"VD = I × L × (R·cosφ + X·sinφ) / (runs × 1000)",  desc:"3-phase line-to-line voltage drop. R and X from POLYCAB catalogue at 90°C. cosφ = running PF; sinφ = √(1 − PF²). L in meters, R in Ω/km." },
  VD_run_pct:{ label:"Running Voltage Drop (%)",      expr:"VD% = VD_volts / V × 100",              desc:"As a percentage of nominal system voltage. Acceptable limit: ≤ 5% for steady-state running per IS-732 / project spec." },
  VD_start: { label:"Starting Voltage Drop (V)",      expr:"VD_s = I × Is_ratio × L × (R·cosφ_s + X·sinφ_s) / (runs × 1000)", desc:"Voltage drop during motor starting. cosφ_s = 0.20 (IS standard starting PF). Is_ratio = Starting current / FLC." },
  VD_start_pct:{ label:"Starting Voltage Drop (%)",   expr:"VD_s% = VD_s_V / V × 100",             desc:"Must remain ≤ 15% to prevent nuisance tripping of adjacent feeders at the common bus." },
};

const DB_TABLES = [
  { name:"projects", color:"#2563eb", fields:[
    {c:"id",type:"UUID",pk:1,note:"Primary key"},
    {c:"oc_number",type:"VARCHAR(50)",note:"Order/Contract No."},
    {c:"oc_name",type:"VARCHAR(200)",note:"Client / Project name"},
    {c:"revision",type:"INTEGER",note:"Document revision"},
    {c:"system_voltage",type:"INTEGER",note:"Default voltage (V)"},
    {c:"created_at",type:"TIMESTAMPTZ",note:""},
  ]},
  { name:"cable_entries", color:"#059669", fields:[
    {c:"id",type:"UUID",pk:1},{c:"project_id",type:"UUID",fk:1,note:"→ projects.id"},
    {c:"tag_number",type:"VARCHAR(50)",note:"Cable tag"},{c:"description",type:"VARCHAR(200)",note:"Equipment desc"},
    {c:"kw_rating",type:"NUMERIC(10,2)",note:"Motor kW"},{c:"voltage",type:"INTEGER",note:"415/6600/11000"},
    {c:"feeder_type",type:"VARCHAR(20)",note:"DOL/RDOL/VFD..."},{c:"length_m",type:"NUMERIC(10,2)",note:"Run length"},
    {c:"efficiency",type:"NUMERIC(5,3)",note:"0–1 decimal"},{c:"pf_running",type:"NUMERIC(5,3)",note:"Running PF"},
    {c:"is_ratio",type:"NUMERIC(5,2)",note:"Istart/FLC"},{c:"laying_method",type:"VARCHAR(30)",note:"In Air/Trench/Duct/UG"},
    {c:"num_cables_group",type:"INTEGER",note:"Grouping count"},{c:"num_runs",type:"INTEGER",note:"Parallel runs"},
    {c:"conductor",type:"VARCHAR(5)",note:"AL or CU"},{c:"air_temp_c",type:"INTEGER",note:"Ambient air °C"},
    {c:"gnd_temp_c",type:"INTEGER",note:"Ground temp °C"},
  ]},
  { name:"cable_results  ⚠ READ-ONLY for users", color:"#d97706", fields:[
    {c:"id",type:"UUID",pk:1},{c:"entry_id",type:"UUID",fk:1,note:"→ cable_entries.id"},
    {c:"flc_amps",type:"NUMERIC(10,3)",note:"Calc FLC"},{c:"derating_factor",type:"NUMERIC(6,4)",note:"Combined DF"},
    {c:"req_rating_a",type:"NUMERIC(10,2)",note:"Required catalogue A"},{c:"cable_size_sqmm",type:"NUMERIC(6,1)",note:"mm²"},
    {c:"base_rating_a",type:"NUMERIC(10,2)",note:"Catalogue base A"},{c:"derated_rating_a",type:"NUMERIC(10,2)",note:"Usable A after DF"},
    {c:"resistance",type:"NUMERIC(8,4)",note:"R at 90°C Ω/km"},{c:"reactance",type:"NUMERIC(8,4)",note:"X Ω/km"},
    {c:"vd_run_v",type:"NUMERIC(8,3)",note:"Running VD V"},{c:"vd_run_pct",type:"NUMERIC(6,3)",note:"Running VD %"},
    {c:"vd_start_v",type:"NUMERIC(8,3)",note:"Starting VD V"},{c:"vd_start_pct",type:"NUMERIC(6,3)",note:"Starting VD %"},
    {c:"is_adequate",type:"BOOLEAN",note:"Derated ≥ FLC"},{c:"calculated_at",type:"TIMESTAMPTZ",note:""},
  ]},
  { name:"catalogue_polycab  ⚠ ADMIN ONLY", color:"#7c3aed", fields:[
    {c:"id",type:"UUID",pk:1},{c:"manufacturer",type:"VARCHAR(50)",note:"POLYCAB/KEC-RPG/KEI"},
    {c:"insulation",type:"VARCHAR(10)",note:"XLPE/PVC"},{c:"conductor",type:"VARCHAR(5)",note:"CU/AL"},
    {c:"num_cores",type:"NUMERIC(4,1)",note:"3/3.5/4"},{c:"size_sqmm",type:"NUMERIC(6,1)",note:"mm²"},
    {c:"rating_in_air",type:"NUMERIC(8,2)",note:"A"},{c:"rating_in_ground",type:"NUMERIC(8,2)",note:"A"},
    {c:"resistance_90",type:"NUMERIC(8,4)",note:"Ω/km at 90°C"},{c:"reactance",type:"NUMERIC(8,4)",note:"Ω/km"},
  ]},
];

// ── Initial schedule rows (from Excel workbook sample data) ─────────
// CHG-001/002/006-8/011
const mk=(id,tag,desc,kw,len,eff,pf,isr,laying,nCab,runs,mat,feeder,V=415)=>({id,tag,desc,kw,length:len,eff,pf,isRatio:isr,laying,numCables:nCab,runs,material:mat,feeder,voltage:V,make:"POLYCAB",insulation:"XLPE",cores:3.5,overrideSize:null,errs:{}});

const INIT = [
  mk(1,"CB-004","LSP-3 Pump",       22,  450,93.5,0.72,4,"In Air",    3,1,"AL","DOL"),
  mk(2,"CB-005","Pump Motor A",     18.5, 70,86.3,0.72,4,"In Air",    3,1,"AL","DOL"),
  mk(3,"CB-006","Pump Motor B",     2.2, 130,84.3,0.72,4,"In Air",    3,1,"AL","DOL"),
  mk(4,"CB-007","Conveyor Drive",   5.5, 700,84.3,0.72,5,"In Air",    3,1,"AL","DOL"),
  mk(5,"CB-008","Fan Motor",        11,  130,90.6,0.72,5,"In Air",    3,1,"CU","DOL"),
  mk(6,"CB-009","Agitator Motor",   15,  130,75.1,0.72,6,"In Air",    3,1,"AL","DOL"),
  mk(7,"CB-010","Compressor",       18.5,370,75.1,0.72,4,"In Air",    3,1,"AL","DOL"),
  mk(8,"CB-011","HT Feeder 55kW",   55,  130,75.9,0.72,4,"In Air",    3,1,"AL","DOL"),
  mk(9,"CB-012","Transformer Feed", 200,  35,80.0,0.80,4,"In Air",    3,2,"AL","DOL"),
  mk(10,"CB-013","VFD Feeder",      37,  250,89.0,0.85,6,"In Trench", 6,1,"AL","VFD"),
];

// ── Color palette ────────────────────────────────────────────────────
const C = {
  bg:"#f1f5f9", surf:"#ffffff", bdr:"#e2e8f0", txt:"#0f172a", sub:"#64748b", muted:"#94a3b8",
  acc:"#2563eb", accDk:"#1d4ed8", calcBg:"#eff6ff", calcBdr:"#bfdbfe", calcTxt:"#1e40af",
  errBg:"#fef2f2", errBdr:"#fca5a5", errTxt:"#dc2626",
  warnBg:"#fffbeb", warnBdr:"#fde68a", warnTxt:"#92400e",
  passBg:"#f0fdf4", passTxt:"#15803d", hdr:"#0f172a",
};

const thS = { padding:"7px 9px", textAlign:"center", fontWeight:700, fontSize:10, letterSpacing:"0.4px", whiteSpace:"nowrap", borderRight:"1px solid rgba(255,255,255,0.15)" };
const numFmt = (v, d=2) => v!=null&&!isNaN(v) ? Number(v).toFixed(d) : "—";
const vdSt = (p, lim) => !p ? null : p>lim*1.5?"fail":p>lim?"warn":"pass";

// ═══════════════════════════════════════════════════════════════════
//  InCell — MODULE LEVEL (outside CableSizingApp).
//
//  BUG 2 ROOT CAUSE: InCell was a const INSIDE CableSizingApp().
//  Every keystroke → updRow → setRows → parent re-renders → InCell
//  reference changes → React unmounts+remounts DOM input → focus lost.
//
//  FIX: Module-level definition (stable reference) + local draft state.
//  onChange updates draft only (no global re-render while typing).
//  onBlur / Enter / Tab commits value to global state.
// ═══════════════════════════════════════════════════════════════════
function InCell({ id, field, val, opts, type="number", min, max, step, errs, updRow }) {
  const hasE = errs && errs[field];
  const [draft, setDraft] = useState(String(val ?? ""));
  const lastCommitted = useRef(String(val ?? ""));

  useEffect(() => {
    const incoming = String(val ?? "");
    if (incoming !== lastCommitted.current) {
      setDraft(incoming);
      lastCommitted.current = incoming;
    }
  }, [val]);

  const commit=(raw)=>{
    const coerced=opts?(isNaN(raw)?raw:Number(raw)):(type==="number"?(parseFloat(raw)||0):raw);
    lastCommitted.current=String(raw);
    updRow(id,field,coerced);
  };

  const borderColor = hasE ? C.errBdr : C.bdr;
  const bg = hasE ? C.errBg : C.surf;

  if (opts) {
    return (
      <td style={{padding:2,border:`1px solid ${borderColor}`,background:bg}}>
        <select value={draft}
          onChange={e=>{setDraft(e.target.value);commit(e.target.value);}}
          style={{border:"none",background:"transparent",width:"100%",padding:"5px 4px",
                  fontSize:11,fontFamily:"inherit",color:C.txt,outline:"none"}}>
          {opts.map(o=>typeof o==="object"?<option key={o.value} value={o.value} disabled={o.disabled??false}>{o.label}</option>:<option key={o} value={o}>{o}</option>)}
        </select>
      </td>
    );
  }

  return (
    <td style={{padding:2,border:`1px solid ${borderColor}`,background:bg}}>
      <input type={type} value={draft} min={min} max={max} step={step??"any"}
        onChange={e=>setDraft(e.target.value)}
        onBlur={e=>commit(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"||e.key==="Tab") commit(e.target.value);}}
        style={{border:"none",background:"transparent",width:"100%",padding:"5px 4px",
                fontSize:11,fontFamily:"monospace",color:hasE?C.errTxt:C.txt,
                outline:"none",textAlign:"right"}}/>
      {hasE&&<div style={{fontSize:9,color:C.errTxt,paddingLeft:4,paddingBottom:2}}>{errs[field]}</div>}
    </td>
  );
}

// CHG-011
function SizeCell({row,autoSize,updRow}){
  const isOvr=row.overrideSize!=null;
  const avail=CATALOGUE.filter(c=>c.make===row.make&&c.insulation===row.insulation&&c.cores===row.cores).map(c=>c.size);
  return(<td title={isOvr?"Override active":"Auto. Dropdown to override."} style={{padding:2,border:`1px solid ${isOvr?"#fde68a":C.calcBdr}`,background:isOvr?"#fffbeb":C.calcBg,minWidth:76}}>
    <select value={row.overrideSize??"auto"} onChange={e=>updRow(row.id,"overrideSize",e.target.value==="auto"?null:Number(e.target.value))}
      style={{border:"none",background:"transparent",width:"100%",padding:"4px",fontSize:11,fontFamily:"monospace",fontWeight:700,color:isOvr?"#d97706":C.calcTxt,outline:"none",cursor:"pointer"}}>
      <option value="auto">{autoSize!=null?`${autoSize}mm²★`:"N/A"}</option>
      {avail.map(s=><option key={s} value={s}>{s}mm²{s===autoSize?"★":""}</option>)}
    </select>
    <div style={{fontSize:8,color:isOvr?"#d97706":C.muted,paddingLeft:4}}>{isOvr?"▲override":"autoƒ"}</div>
  </td>);
}

function CableSizingApp() {
  const [tab, setTab] = useState("schedule");
  const [rows, setRows] = useState(INIT);
  const [nxtId, setNxtId] = useState(INIT.length+1);
  const [fPop, setFPop] = useState(null);
  const [proj, setProj] = useState({ocNo:"630276",ocName:"VSP – WWTP Area",rev:3,voltage:415,freq:50,std:"IS-1554 / IS-732",airTemp:50,gndTemp:30});
  const [catFilter,setCatFilter]=useState({make:"POLYCAB",insulation:"XLPE",cores:3.5});
  const [mc, setMc] = useState({kw:30,voltage:415,eff:88,pf:0.88,isRatio:7.2,length:143,material:"AL",laying:"In Air",numCables:6,airTemp:50,gndTemp:30,runs:1});
  const [dv, setDv] = useState({airTemp:50,gndTemp:30,numCables:6,laying:"In Air"});

  const results = useMemo(() => {
    const m={};
    rows.forEach(r=>{m[r.id]=computeRow(r,proj);});
    return m;
  },[rows,proj]);

  const mcFLC = useMemo(()=>calcFLC(mc.kw,mc.voltage,mc.eff/100,mc.pf),[mc]);
  const mcDF  = useMemo(()=>calcDF(mc.airTemp,mc.gndTemp,mc.numCables,mc.laying),[mc]);
  const mcCable = useMemo(()=>{
    if(!mcFLC) return null;
    return pickCable(mcFLC/mcDF.combined, mc.material, mc.laying);
  },[mcFLC,mcDF,mc]);
  const mcVD = useMemo(()=>{
    if(!mcFLC||!mcCable) return null;
    const R=mc.material==="CU"?mcCable.R_cu:mcCable.R_al;
    return calcVD(mcFLC,mc.length,R,mcCable.X,mc.pf,mc.isRatio,mc.runs);
  },[mcFLC,mcCable,mc]);
  const dvDF = useMemo(()=>calcDF(dv.airTemp,dv.gndTemp,dv.numCables,dv.laying),[dv]);

  const updRow = useCallback((id,field,val)=>{
    setRows(prev=>prev.map(r=>{
      if(r.id!==id) return r;
      const u={...r,[field]:val};
      if(["make","insulation","cores"].includes(field)) u.overrideSize=null;
      const e={};
      if(!u.kw||u.kw<=0)          e.kw="Required, > 0 kW";
      if(!u.length||u.length<=0)   e.length="Required, > 0 m";
      if(u.eff<50||u.eff>100)      e.eff="Range: 50–100 %";
      if(u.pf<0.1||u.pf>1)         e.pf="Range: 0.10–1.00";
      if(u.isRatio<1||u.isRatio>15) e.isRatio="Range: 1–15×";
      if(u.runs<1||u.runs>20)       e.runs="Range: 1–20";
      return {...u,errs:e};
    }));
  },[]);

  const addRow = ()=>{
    const id=nxtId; setNxtId(id+1);
    setRows(p=>[...p,mk(id,`CB-${String(id).padStart(3,"0")}`,"New Equipment",0,100,90,0.85,6,"In Air",3,1,"AL","DOL",proj.voltage)]);
  };

  const TABS=[
    {id:"inputs",   label:"Project Inputs",   icon:"🏗"},
    {id:"schedule", label:"Cable Schedule",   icon:"⚡"},
    {id:"motor",    label:"Motor Calculator", icon:"🔧"},
    {id:"derating", label:"Derating Factors", icon:"📊"},
    {id:"catalogue",label:"Cable Catalogue",  icon:"📖"},
    {id:"schema",   label:"DB Schema",        icon:"🗄"},
  ];

  // ── Shared sub-components ──────────────────────────────────────────
  const SecHdr = ({children,bg="#0f172a",fg="#f1f5f9"})=>(
    <div style={{background:bg,color:fg,padding:"8px 16px",fontSize:11,fontWeight:700,letterSpacing:"0.7px"}}>{children}</div>
  );

  const CalcTd = ({val,fKey,calc,extraStyle={}})=>(
    <td title="Click to view formula"
      onClick={()=>setFPop({fKey,calc})}
      style={{background:C.calcBg,color:C.calcTxt,padding:"5px 8px",border:`1px solid ${C.calcBdr}`,
              cursor:"pointer",whiteSpace:"nowrap",fontFamily:"monospace",fontSize:12,textAlign:"right",...extraStyle}}>
      {val??<span style={{color:C.muted}}>—</span>}
      <span style={{color:"#93c5fd",fontSize:9,marginLeft:2}}>ƒ</span>
    </td>
  );

  const FRow = ({label,val,unit,calc,note,fKey,calcData})=>(
    <tr style={{borderBottom:`1px solid ${C.bdr}`}}>
      <td style={{padding:"8px 14px",color:C.sub,fontSize:12,width:280,whiteSpace:"nowrap"}}>{label}</td>
      <td onClick={calc&&fKey?()=>setFPop({fKey,calc:calcData??{}}):undefined}
        style={{padding:"8px 14px",textAlign:"right",fontFamily:"monospace",fontSize:13,fontWeight:600,
                color:calc?C.calcTxt:C.txt,background:calc?C.calcBg:"transparent",cursor:calc&&fKey?"pointer":"default"}}>
        {val??<span style={{color:C.muted}}>—</span>}{calc&&<span style={{color:"#93c5fd",fontSize:9,marginLeft:2}}>ƒ</span>}
      </td>
      <td style={{padding:"8px 14px",color:C.muted,fontSize:11,width:55}}>{unit}</td>
      <td style={{padding:"8px 14px",color:C.muted,fontSize:11,maxWidth:280}}>{note}</td>
    </tr>
  );

  const Badge = ({label,color,bg})=>(
    <span style={{display:"inline-block",padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700,background:bg,color}}>{label}</span>
  );

  return (
    <div style={{fontFamily:"'IBM Plex Sans',system-ui,sans-serif",fontSize:13,color:C.txt,background:C.bg,minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}
        .tbtn{background:none;border:none;cursor:pointer;font-family:inherit;transition:color .15s;}
        .tbtn:hover{color:#1e293b !important;}
        .drow:hover td{background:#f8fafc;}
        .btn{cursor:pointer;border:none;border-radius:5px;font-family:inherit;font-weight:600;transition:opacity .15s;}
        .btn:hover{opacity:.85;}
        input[type=number]{-moz-appearance:textfield;}
        input::-webkit-inner-spin-button{display:none;}
        select{appearance:none;}
      `}</style>

      {/* HEADER */}
      <div style={{background:C.hdr,color:"#f8fafc",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,borderBottom:"3px solid #2563eb"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:6,background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>⚡</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>Cable Sizing Calculator — Safe Web Edition</div>
            <div style={{fontSize:10,color:"#94a3b8",letterSpacing:"0.5px"}}>POC v1.0 · Excel → Web App Conversion · POLYCAB LT-XLPE · IS-1554 / IS-732</div>
          </div>
        </div>
        <div style={{display:"flex",gap:20,fontSize:11,color:"#94a3b8"}}>
          <span>OC: <b style={{color:"#f1f5f9"}}>{proj.ocNo}</b></span>
          <span>Project: <b style={{color:"#f1f5f9"}}>{proj.ocName}</b></span>
          <span>Rev: <b style={{color:"#f1f5f9"}}>{proj.rev}</b></span>
          <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block",boxShadow:"0 0 4px #22c55e"}}/><span style={{color:"#22c55e"}}>Auto-Calc ON</span></span>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{background:C.surf,borderBottom:`1px solid ${C.bdr}`,display:"flex",padding:"0 24px"}}>
        {TABS.map(t=>(
          <button key={t.id} className="tbtn" onClick={()=>setTab(t.id)}
            style={{padding:"10px 18px",fontSize:12,fontWeight:tab===t.id?700:500,
                    color:tab===t.id?C.acc:C.sub,
                    borderBottom:tab===t.id?`2px solid ${C.acc}`:"2px solid transparent",marginBottom:-1}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{paddingBottom:44}}>

        {/* ══ PROJECT INPUTS ══════════════════════════════════════════ */}
        {tab==="inputs" && (
          <div style={{maxWidth:680,margin:"28px auto 0",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:8,overflow:"hidden"}}>
            <SecHdr>🏗 PROJECT INFORMATION — Editable Inputs</SecHdr>
            <div style={{padding:24,display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              {[
                {label:"OC Number",key:"ocNo",type:"text"},
                {label:"Project Name",key:"ocName",type:"text"},
                {label:"Revision No.",key:"rev",type:"number"},
                {label:"System Voltage (V)",key:"voltage",type:"number"},
                {label:"Frequency (Hz)",key:"freq",type:"number"},
                {label:"Standard",key:"std",type:"text"},
              ].map(f=>(
                <div key={f.key}>
                  <label style={{fontSize:10,color:C.sub,fontWeight:700,letterSpacing:"0.4px",display:"block",marginBottom:5}}>{f.label.toUpperCase()}</label>
                  <input type={f.type} value={proj[f.key]}
                    onChange={e=>setProj(p=>({...p,[f.key]:f.type==="number"?Number(e.target.value):e.target.value}))}
                    style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.bdr}`,borderRadius:5,fontSize:13,fontFamily:"inherit",outline:"none",background:"#f8fafc"}}
                    onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor=C.bdr}/>
                </div>
              ))}
              <div style={{gridColumn:"1/-1",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:6,padding:"12px 16px",marginTop:4}}>
                <div style={{fontSize:10,color:"#1e40af",fontWeight:700,marginBottom:10}}>🌡 SITE CONDITIONS — F1/F2 derating for all cables in project</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  {[{label:"Air Temp",key:"airTemp",opts:AIR_TEMPS},{label:"Ground Temp",key:"gndTemp",opts:GND_TEMPS}].map(f=>(
                    <div key={f.key}>
                      <label style={{fontSize:10,color:C.sub,fontWeight:700,display:"block",marginBottom:5}}>{f.label.toUpperCase()} (°C)</label>
                      <select value={proj[f.key]} onChange={e=>setProj(p=>({...p,[f.key]:Number(e.target.value)}))}
                        style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.bdr}`,borderRadius:5,fontSize:13,fontFamily:"inherit",background:"#f8fafc"}}>
                        {f.opts.map(v=><option key={v} value={v}>{v}°C</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{margin:"0 24px 24px",background:C.passBg,border:`1px solid #86efac`,borderRadius:6,padding:"10px 14px",fontSize:11,color:C.passTxt}}>
              ✅ <b>Key Principle:</b> All fields here are editable inputs. Blue cells on other sheets are <i>calculated outputs</i> — locked from editing, recomputed automatically by the backend engine whenever inputs change.
            </div>
          </div>
        )}

        {/* ══ CABLE SCHEDULE ══════════════════════════════════════════ */}
        {tab==="schedule" && (
          <div style={{padding:"16px 12px 0"}}>
            <div style={{display:"flex",gap:16,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:14}}>
                {[
                  [C.surf,C.bdr,"Input cell (editable)"],
                  [C.calcBg,C.calcBdr,"Calculated — click ƒ for formula"],
                  [C.errBg,C.errBdr,"Validation error"],
                ].map(([bg,bdr,lbl])=>(
                  <div key={lbl} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
                    <div style={{width:18,height:13,background:bg,border:`1px solid ${bdr}`,borderRadius:2}}/>
                    <span style={{color:C.sub}}>{lbl}</span>
                  </div>
                ))}
              </div>
              <button className="btn" onClick={addRow}
                style={{marginLeft:"auto",padding:"7px 16px",background:C.acc,color:"#fff",fontSize:12}}>
                + Add Row
              </button>
            </div>

            <div style={{overflowX:"auto",borderRadius:6,border:`1px solid ${C.bdr}`,boxShadow:"0 1px 5px rgba(0,0,0,0.07)"}}>
              <table style={{borderCollapse:"collapse",fontSize:11,minWidth:"100%"}}>
                <thead>
                  <tr style={{background:C.hdr,color:"#f1f5f9"}}>
                    <th style={thS} rowSpan={2}>#</th>
                    <th style={{...thS,background:"#1e40af"}} colSpan={16}>INPUT PARAMETERS — Editable</th>
                    <th style={{...thS,background:"#065f46"}} colSpan={9}>CALCULATED RESULTS — Click ƒ to view formula</th>
                    <th style={thS} rowSpan={2}></th>
                  </tr>
                  <tr style={{background:"#1e293b",color:"#cbd5e1",fontSize:10}}>
                    {["Tag","Description","kW","V","Feeder","Length(m)","η%","PF","Is/In","Laying","In\nGrp","Runs","Mat","Make","Ins.","Cores"].map(h=>(
                      <th key={h} style={{...thS,background:"#1e40af",whiteSpace:"pre",padding:"5px 8px"}}>{h}</th>
                    ))}
                    {["FLC\n(A)","DF","Req'd\n(A)","Size\nmm²","Base\n(A)","Derated\n(A)","R\nΩ/km","VD Run\nV / %","VD Start\nV / %"].map(h=>(
                      <th key={h} style={{...thS,background:"#065f46",whiteSpace:"pre",padding:"5px 8px"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row,ri)=>{
                    const c=results[row.id]||{};
                    const stR=vdSt(c.VD_run_pct,5);
                    const stS=vdSt(c.VD_start_pct,15);
                    return (
                      <tr key={row.id} className="drow" style={{borderBottom:`1px solid ${C.bdr}`}}>
                        <td style={{padding:"5px 8px",textAlign:"center",color:C.muted,fontSize:10,background:"#f8fafc",borderRight:`1px solid ${C.bdr}`,fontWeight:700}}>{ri+1}</td>
                        <InCell id={row.id} field="tag"       val={row.tag}       type="text" errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="desc"      val={row.desc}      type="text" errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="kw"        val={row.kw}        min={0.1}   errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="voltage"   val={row.voltage}   opts={VOLTAGES} errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="feeder"    val={row.feeder}    opts={FEEDER_TYPES} errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="length"    val={row.length}    min={1}     errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="eff"       val={row.eff}       min={50} max={100} step={0.1} errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="pf"        val={row.pf}        min={0.1} max={1} step={0.01} errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="isRatio"   val={row.isRatio}   min={1} max={15} step={0.1} errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="laying"    val={row.laying}    opts={LAYING_METHODS} errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="numCables" val={row.numCables} min={1} max={20} step={1} errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="runs"      val={row.runs}      min={1} max={20} step={1} errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="material"   val={row.material}   opts={MATERIALS}  errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="make"        val={row.make}       opts={MAKE_OPTS}  errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="insulation"  val={row.insulation} opts={INS_OPTS}   errs={row.errs} updRow={updRow}/>
                        <InCell id={row.id} field="cores"       val={row.cores}      opts={CORE_OPTS}  errs={row.errs} updRow={updRow}/>
                        <CalcTd val={numFmt(c.flc)} fKey="flc" calc={c}/>
                        <CalcTd val={numFmt(c.df,4)} fKey="df" calc={c}/>
                        <CalcTd val={numFmt(c.reqR,1)} fKey="reqR" calc={c}/>
                        <SizeCell row={row} autoSize={c.noMatch?null:c.size} updRow={updRow}/>
                        <CalcTd val={c.baseA??<span style={{color:C.muted}}>—</span>} fKey="size" calc={c}/>
                        <CalcTd val={c.deratedA!=null?numFmt(c.deratedA):"—"} fKey="deratedA" calc={c}
                          extraStyle={{color:c.ok===false?C.errTxt:c.ok?C.passTxt:C.calcTxt,fontWeight:700}}/>
                        <CalcTd val={c.R?numFmt(c.R,3):"—"} fKey="VD_run" calc={c}/>
                        <td onClick={()=>setFPop({fKey:"VD_run",calc:c})}
                          style={{background:C.calcBg,border:`1px solid ${C.calcBdr}`,padding:"5px 8px",cursor:"pointer",textAlign:"right",minWidth:80}}>
                          <div style={{fontFamily:"monospace",fontSize:11,color:C.calcTxt}}>{numFmt(c.VD_run)} V <span style={{color:"#93c5fd",fontSize:9}}>ƒ</span></div>
                          <div style={{fontSize:11,fontWeight:700,color:stR==="pass"?C.passTxt:stR==="warn"?C.warnTxt:C.errTxt}}>
                            {numFmt(c.VD_run_pct)}% {stR==="pass"?"✓":stR==="warn"?"⚠":"✗"}
                          </div>
                        </td>
                        <td onClick={()=>setFPop({fKey:"VD_start",calc:c})}
                          style={{background:C.calcBg,border:`1px solid ${C.calcBdr}`,padding:"5px 8px",cursor:"pointer",textAlign:"right",minWidth:80}}>
                          <div style={{fontFamily:"monospace",fontSize:11,color:C.calcTxt}}>{numFmt(c.VD_start)} V <span style={{color:"#93c5fd",fontSize:9}}>ƒ</span></div>
                          <div style={{fontSize:11,fontWeight:700,color:stS==="pass"?C.passTxt:stS==="warn"?C.warnTxt:C.errTxt}}>
                            {numFmt(c.VD_start_pct)}% {stS==="pass"?"✓":stS==="warn"?"⚠":"✗"}
                          </div>
                        </td>
                        <td style={{padding:"0 5px",background:"#f8fafc",borderLeft:`1px solid ${C.bdr}`}}>
                          <button className="btn" onClick={()=>setRows(p=>p.filter(r=>r.id!==row.id))}
                            style={{padding:"3px 7px",background:"#fee2e2",color:C.errTxt,fontSize:10}}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:8,fontSize:10,color:C.muted}}>
              Limits per IS-732 / project spec: Running VD ≤ 5% (✓ Pass) | Starting VD ≤ 15% | ✗ Fail = exceeds limit · Catalogue: POLYCAB LT-XLPE 3.5C Armoured (IS-8130/1984, 90°C ratings)
            </div>
          </div>
        )}

        {/* ══ MOTOR CALCULATOR ════════════════════════════════════════ */}
        {tab==="motor" && (
          <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:0,margin:"20px 20px 0",border:`1px solid ${C.bdr}`,borderRadius:8,overflow:"hidden",boxShadow:"0 1px 5px rgba(0,0,0,0.07)"}}>
            <div style={{background:C.surf,borderRight:`1px solid ${C.bdr}`}}>
              <SecHdr>🔧 SECTION A — MOTOR INPUTS</SecHdr>
              <div style={{padding:18}}>
                {[
                  {l:"Motor kW Rating",k:"kw",t:"number",u:"kW",mn:0.1},
                  {l:"System Voltage",k:"voltage",t:"sel",u:"V",o:VOLTAGES},
                  {l:"Efficiency",k:"eff",t:"number",u:"%",mn:50,mx:100},
                  {l:"Running Power Factor",k:"pf",t:"number",u:"",mn:0.1,mx:1,st:0.01},
                  {l:"Starting Current Ratio",k:"isRatio",t:"number",u:"× FLC",mn:1,mx:12,st:0.1},
                  {l:"Cable Length",k:"length",t:"number",u:"m",mn:1},
                  {l:"Laying Method",k:"laying",t:"sel",o:LAYING_METHODS},
                  {l:"Cables in Group",k:"numCables",t:"number",u:"",mn:1,mx:20,st:1},
                  {l:"Parallel Runs",k:"runs",t:"number",u:"",mn:1,mx:20,st:1},
                  {l:"Ambient Air Temp",k:"airTemp",t:"sel",u:"°C",o:AIR_TEMPS},
                  {l:"Ground Temp",k:"gndTemp",t:"sel",u:"°C",o:GND_TEMPS},
                  {l:"Conductor Material",k:"material",t:"sel",o:MATERIALS},
                ].map(f=>(
                  <div key={f.k} style={{marginBottom:11}}>
                    <label style={{fontSize:10,color:C.sub,fontWeight:700,display:"block",marginBottom:4}}>{f.l.toUpperCase()}</label>
                    {f.t==="sel"?(
                      <select value={mc[f.k]} onChange={e=>setMc(p=>({...p,[f.k]:isNaN(e.target.value)?e.target.value:Number(e.target.value)}))}
                        style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.bdr}`,borderRadius:5,fontSize:12,fontFamily:"inherit",background:"#f8fafc"}}>
                        {f.o.map(o=><option key={o} value={o}>{o} {f.u??""}</option>)}
                      </select>
                    ):(
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" value={mc[f.k]} min={f.mn} max={f.mx} step={f.st??"any"}
                          onChange={e=>setMc(p=>({...p,[f.k]:parseFloat(e.target.value)||0}))}
                          style={{flex:1,padding:"7px 10px",border:`1px solid ${C.bdr}`,borderRadius:5,fontSize:12,fontFamily:"monospace",background:"#f8fafc",textAlign:"right"}}
                          onFocus={e=>e.target.style.borderColor=C.acc} onBlur={e=>e.target.style.borderColor=C.bdr}/>
                        <span style={{fontSize:10,color:C.muted,width:40}}>{f.u}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:"#f8fafc",display:"flex",flexDirection:"column",gap:16,padding:20}}>
              {/* Section B */}
              <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:6,overflow:"hidden"}}>
                <SecHdr bg="#1e40af" fg="#dbeafe">SECTION B — CABLE SIZING (CURRENT RATING CRITERION)</SecHdr>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <tbody>
                    <FRow label="Calculated Full Load Current" unit="A" calc fKey="flc"
                      val={mcFLC?numFmt(mcFLC):"—"}
                      note={mcFLC?`= (${mc.kw}×1000)/(√3×${mc.voltage}×${mc.eff/100}×${mc.pf}) = ${numFmt(mcFLC)} A`:""}
                      calcData={{flc:mcFLC}} />
                    <FRow label="F₁ – Air Temp Derating Factor"  unit="" calc fKey="df" val={numFmt(mcDF.fA,4)}   note={`POLYCAB XLPE @ ${mc.airTemp}°C`} calcData={{dfBreak:mcDF,df:mcDF.combined}}/>
                    <FRow label="F₂ – Ground Temp Derating"      unit="" calc fKey="df" val={numFmt(mcDF.fG,4)}   note={`@ ${mc.gndTemp}°C`} calcData={{dfBreak:mcDF,df:mcDF.combined}}/>
                    <FRow label="F₃ – Cable Grouping Factor"     unit="" calc fKey="df" val={numFmt(mcDF.fGrp,4)} note={`${mc.numCables} cables – ${mc.laying}`} calcData={{dfBreak:mcDF,df:mcDF.combined}}/>
                    <FRow label="F₄ – Depth / Install Factor"    unit="" calc fKey="df" val={numFmt(mcDF.fDep,4)} note={`${mc.laying}`} calcData={{dfBreak:mcDF,df:mcDF.combined}}/>
                    <FRow label="COMBINED DERATING FACTOR"       unit="" calc fKey="df" calcData={{dfBreak:mcDF,df:mcDF.combined}}
                      val={<strong style={{fontSize:16,color:C.accDk}}>{mcDF.combined}</strong>} note="F₁ × F₂ × F₃ × F₄"/>
                    <FRow label="Required Catalogue Rating"      unit="A" calc fKey="reqR" calcData={{flc:mcFLC,df:mcDF.combined,reqR:mcFLC?+(mcFLC/mcDF.combined).toFixed(1):null}}
                      val={mcFLC?numFmt(mcFLC/mcDF.combined,1):"—"} note="FLC ÷ Combined DF"/>
                    <FRow label="Selected Cable (POLYCAB)" unit="mm²" calc fKey="size" calcData={{}}
                      val={mcCable?<strong style={{fontSize:16,color:C.accDk}}>{mcCable.size}</strong>:"Not found"}
                      note={mcCable?`${mc.runs}R × 3.5C × ${mcCable.size}mm² ${mc.material} XLPE Armoured`:"No cable in catalogue meets requirement"}/>
                    <FRow label="Base Catalogue Rating" unit="A" calc fKey="size" calcData={{}}
                      val={mcCable?mcCable[mc.material==="CU"?(mc.laying==="In Air"?"cu_air":"cu_gnd"):(mc.laying==="In Air"?"al_air":"al_gnd")]:"—"}/>
                    {mcCable&&mcFLC&&(()=>{
                      const bk=mc.material==="CU"?(mc.laying==="In Air"?"cu_air":"cu_gnd"):(mc.laying==="In Air"?"al_air":"al_gnd");
                      const dr=mcCable[bk]*mcDF.combined*mc.runs;
                      return (
                        <>
                          <FRow label="Derated Rating (Base × DF × Runs)" unit="A" calc fKey="deratedA" calcData={{deratedA:dr,flc:mcFLC,df:mcDF.combined,baseA:mcCable[bk]}}
                            val={<span style={{color:dr>=mcFLC?C.passTxt:C.errTxt,fontWeight:700,fontSize:14}}>{numFmt(dr)}</span>}
                            note={`FLC = ${numFmt(mcFLC)} A`}/>
                          <FRow label="CABLE ADEQUACY" unit="" calc val={
                            dr>=mcFLC
                              ?<Badge label="✅ ADEQUATE — Derated rating ≥ FLC" color={C.passTxt} bg={C.passBg}/>
                              :<Badge label="❌ INADEQUATE — Increase runs or size" color={C.errTxt} bg={C.errBg}/>} />
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Section C */}
              {mcCable&&mcFLC&&mcVD&&(()=>{
                const R=mc.material==="CU"?mcCable.R_cu:mcCable.R_al;
                const vdRpct=+(mcVD.VD_run/mc.voltage*100).toFixed(3);
                const vdSpct=+(mcVD.VD_start/mc.voltage*100).toFixed(3);
                return (
                  <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:6,overflow:"hidden"}}>
                    <SecHdr bg="#065f46" fg="#d1fae5">SECTION C — VOLTAGE DROP CRITERION</SecHdr>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <tbody>
                        <FRow label="Resistance R (90°C)" unit="Ω/km" calc val={numFmt(R,4)} note="From POLYCAB catalogue – IS-8130/1984"/>
                        <FRow label="Reactance X" unit="Ω/km" calc val={numFmt(mcCable.X,4)}/>
                        <FRow label="Running VD" unit="V" calc fKey="VD_run" calcData={{VD_run:mcVD.VD_run,VD_run_pct:vdRpct,flc:mcFLC}}
                          val={numFmt(mcVD.VD_run)}
                          note={`= ${numFmt(mcFLC)}×${mc.length}×(${numFmt(R,3)}×${mc.pf}+${numFmt(mcCable.X,4)}×${numFmt(Math.sqrt(1-mc.pf**2),3)})/(${mc.runs}×1000)`}/>
                        <FRow label="Running VD %" unit="%" calc fKey="VD_run_pct" calcData={{VD_run:mcVD.VD_run,VD_run_pct:vdRpct}}
                          val={<span style={{color:vdRpct<=5?C.passTxt:C.errTxt,fontWeight:700}}>{numFmt(vdRpct,3)}%</span>} note="Limit: ≤ 5%"/>
                        <FRow label="Starting VD" unit="V" calc fKey="VD_start" calcData={{VD_start:mcVD.VD_start,VD_start_pct:vdSpct,flc:mcFLC}}
                          val={numFmt(mcVD.VD_start)} note={`Is/In = ${mc.isRatio}×, cosφ_s = 0.20 (IS default)`}/>
                        <FRow label="Starting VD %" unit="%" calc fKey="VD_start_pct" calcData={{VD_start:mcVD.VD_start,VD_start_pct:vdSpct}}
                          val={<span style={{color:vdSpct<=15?C.passTxt:C.errTxt,fontWeight:700}}>{numFmt(vdSpct,3)}%</span>} note="Limit: ≤ 15%"/>
                        <FRow label="VERDICT" unit="" calc
                          val={vdRpct<=5&&vdSpct<=15
                            ?<Badge label={`✅ PASS — ${mc.runs}R × 3.5C × ${mcCable.size}mm² ${mc.material} XLPE suitable for ${mc.kw}kW motor`} color={C.passTxt} bg={C.passBg}/>
                            :<Badge label={`⚠ REVIEW — VD exceeds limit (Run:${numFmt(vdRpct,1)}% Start:${numFmt(vdSpct,1)}%)`} color={C.warnTxt} bg={C.warnBg}/>}/>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ══ DERATING FACTORS ════════════════════════════════════════ */}
        {tab==="derating" && (
          <div style={{padding:"20px 20px 0",display:"grid",gridTemplateColumns:"240px 1fr",gap:20}}>
            <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:8,overflow:"hidden",alignSelf:"start"}}>
              <SecHdr>SELECT CONDITIONS</SecHdr>
              <div style={{padding:16}}>
                {[
                  {l:"Ambient Air Temp",k:"airTemp",o:AIR_TEMPS,u:"°C"},
                  {l:"Ground Temperature",k:"gndTemp",o:GND_TEMPS,u:"°C"},
                  {l:"Cables in Group",k:"numCables",o:GROUP_COUNTS,u:"no."},
                  {l:"Laying Method",k:"laying",o:LAYING_METHODS},
                ].map(f=>(
                  <div key={f.k} style={{marginBottom:13}}>
                    <label style={{fontSize:10,color:C.sub,fontWeight:700,display:"block",marginBottom:4}}>{f.l.toUpperCase()}</label>
                    <select value={dv[f.k]} onChange={e=>setDv(p=>({...p,[f.k]:isNaN(e.target.value)?e.target.value:Number(e.target.value)}))}
                      style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.bdr}`,borderRadius:5,fontSize:12,fontFamily:"inherit",background:"#f8fafc"}}>
                      {f.o.map(o=><option key={o} value={o}>{o} {f.u??""}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{marginTop:14,padding:13,background:C.calcBg,border:`1px solid ${C.calcBdr}`,borderRadius:6}}>
                  <div style={{fontSize:10,color:C.sub,fontWeight:700,marginBottom:8}}>RESULT</div>
                  {[["F₁ Air Temp",numFmt(dvDF.fA,4)],["F₂ Ground",numFmt(dvDF.fG,4)],["F₃ Grouping",numFmt(dvDF.fGrp,4)],["F₄ Install",numFmt(dvDF.fDep,4)]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.calcBdr}`,fontSize:12}}>
                      <span style={{color:C.sub}}>{l}</span><span style={{fontFamily:"monospace",color:C.calcTxt}}>{v}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                    <span style={{fontWeight:700}}>Combined =</span>
                    <span style={{fontSize:22,fontWeight:700,color:C.accDk,fontFamily:"monospace"}}>{dvDF.combined}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                {title:"A. AMBIENT AIR TEMPERATURE — POLYCAB/KEI LT-XLPE",map:AIR_TEMP_DF,selKey:"airTemp",colLabel:"Temp (°C)"},
                {title:"B. GROUND TEMPERATURE — POLYCAB/KEI LT-XLPE",map:GND_TEMP_DF,selKey:"gndTemp",colLabel:"Temp (°C)"},
              ].map(({title,map,selKey,colLabel})=>(
                <div key={title} style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:6,overflow:"hidden"}}>
                  <SecHdr>{title}</SecHdr>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead>
                        <tr style={{background:"#dbeafe"}}>
                          <th style={{padding:"7px 14px",textAlign:"left",color:C.sub,fontWeight:700,fontSize:11}}>{colLabel}</th>
                          {Object.keys(map).map(k=>(
                            <th key={k} style={{padding:"7px 14px",textAlign:"center",fontWeight:700,fontSize:11,
                              color:Number(k)===dv[selKey]?C.accDk:C.sub,
                              background:Number(k)===dv[selKey]?"#bfdbfe":"#dbeafe"}}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{padding:"9px 14px",fontWeight:600,color:C.sub,fontSize:11}}>XLPE Factor</td>
                          {Object.entries(map).map(([k,v])=>(
                            <td key={k} style={{padding:"9px 14px",textAlign:"center",fontFamily:"monospace",fontWeight:700,
                              color:Number(k)===dv[selKey]?C.accDk:C.txt,
                              background:Number(k)===dv[selKey]?C.calcBg:"transparent"}}>{v}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:6,overflow:"hidden"}}>
                <SecHdr>C. CABLE GROUPING FACTORS (MULTICORE) — IS-1554 / POLYCAB</SecHdr>
                {/* Mapping note: explains why only 2 rows exist for 4 laying methods */}
                <div style={{padding:"8px 16px 6px",background:"#fffbeb",borderBottom:`1px solid #fde68a`,fontSize:11,color:"#92400e",display:"flex",flexWrap:"wrap",gap:"10px",alignItems:"center"}}>
                  <span style={{fontWeight:700}}>⚡ Standard defines exactly 2 grouping categories:</span>
                  <span style={{background:"#dbeafe",borderRadius:4,padding:"2px 8px",color:"#1d4ed8",fontWeight:600}}>In Air → cables on open trays / free air  (F₄ = 1.00)</span>
                  <span style={{background:"#d1fae5",borderRadius:4,padding:"2px 8px",color:"#065f46",fontWeight:600}}>In Ground → covers: In Trench (F₄=1.00)  •  In Duct (F₄=0.95)  •  Underground (F₄=0.91)</span>
                  <span style={{color:"#78350f"}}>The additional F₄ factor for each method is shown in Section D below.</span>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:"#fef3c7"}}>
                        <th style={{padding:"7px 14px",textAlign:"left",color:C.sub,fontWeight:700,fontSize:11}}>Cables in Group</th>
                        {Object.keys(GROUP_DF_AIR).map(n=>(
                          <th key={n} style={{padding:"7px 14px",textAlign:"center",fontWeight:700,fontSize:11,
                            color:Number(n)===dv.numCables?"#78350f":C.sub,
                            background:Number(n)===dv.numCables?"#fde68a":"#fef3c7"}}>{n}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[["In Air",GROUP_DF_AIR,"In Air"],["In Ground",GROUP_DF_GND,"ground"]].map(([lbl,map,cat])=>{
                        const isActive = cat==="In Air" ? dv.laying==="In Air" : dv.laying!=="In Air";
                        // For the active "In Ground" row, show the actual selected method name as badge
                        const activeMethodBadge = isActive && cat!=="In Air" && dv.laying!=="In Air"
                          ? ` ← active (${dv.laying})` : "";
                        return (
                          <tr key={lbl} style={{borderBottom:`1px solid ${C.bdr}`,background:isActive?"#fffbeb":"transparent"}}>
                            <td style={{padding:"8px 14px",fontWeight:700,fontSize:11,
                              color:isActive?"#78350f":C.sub,
                              background:isActive?"#fef9c3":"transparent",minWidth:160}}>
                              {lbl}
                              {activeMethodBadge&&<span style={{fontSize:10,color:"#92400e",fontWeight:600,marginLeft:4,background:"#fde68a",borderRadius:3,padding:"1px 5px"}}>{dv.laying}</span>}
                            </td>
                            {Object.entries(map).map(([n,v])=>(
                              <td key={n} style={{padding:"8px 14px",textAlign:"center",fontFamily:"monospace",fontWeight:700,
                                color:Number(n)===dv.numCables&&isActive?"#78350f":C.txt,
                                background:Number(n)===dv.numCables&&isActive?"#fef3c7":"transparent"}}>{v}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── NEW: Section D — F4 Installation Method Factors ─────────────── */}
              <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:6,overflow:"hidden"}}>
                <SecHdr>D. F₄ — INSTALLATION METHOD FACTORS (DEPTH / ENCLOSURE)</SecHdr>
                <div style={{padding:"8px 16px 6px",background:"#f0fdf4",borderBottom:`1px solid #bbf7d0`,fontSize:11,color:"#166534"}}>
                  <span style={{fontWeight:700}}>Note: </span>F₄ corrects for the thermal effect of the installation enclosure/depth, independent of cable grouping.
                  All four methods use the same F₃ grouping category (In Air or In Ground) — F₄ is the additional multiplier applied on top.
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:"#d1fae5"}}>
                        <th style={{padding:"7px 14px",textAlign:"left",color:"#065f46",fontWeight:700,fontSize:11}}>Laying Method</th>
                        <th style={{padding:"7px 14px",textAlign:"center",color:"#065f46",fontWeight:700,fontSize:11}}>F₃ Grouping Table Used</th>
                        <th style={{padding:"7px 14px",textAlign:"center",color:"#065f46",fontWeight:700,fontSize:11}}>F₄ Install Factor</th>
                        <th style={{padding:"7px 14px",textAlign:"left",color:"#065f46",fontWeight:700,fontSize:11}}>Rationale (IS-1554)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["In Air",      "In Air (Table C, Row 1)",   "1.00", "Open trays / free air — best heat dissipation, no penalty"],
                        ["In Trench",   "In Ground (Table C, Row 2)","1.00", "Open trench — ground grouping, but no depth reduction"],
                        ["In Duct",     "In Ground (Table C, Row 2)","0.95", "Enclosed conduit — reduced airflow, 5% capacity reduction"],
                        ["Underground", "In Ground (Table C, Row 2)","0.91", "Direct buried — worst heat dissipation, 9% capacity reduction"],
                      ].map(([method,grp,f4,rationale],i)=>{
                        const isActive = dv.laying===method;
                        return (
                          <tr key={method} style={{borderBottom:`1px solid ${C.bdr}`,background:isActive?"#dcfce7":"transparent"}}>
                            <td style={{padding:"9px 14px",fontWeight:700,fontSize:12,
                              color:isActive?"#166534":C.txt}}>
                              {method}
                              {isActive&&<span style={{marginLeft:6,fontSize:10,background:"#16a34a",color:"white",borderRadius:3,padding:"1px 6px",fontWeight:700}}>ACTIVE</span>}
                            </td>
                            <td style={{padding:"9px 14px",textAlign:"center",fontSize:11,color:isActive?"#166534":C.sub,fontWeight:isActive?700:400}}>{grp}</td>
                            <td style={{padding:"9px 14px",textAlign:"center",fontFamily:"monospace",fontWeight:700,fontSize:13,
                              color:isActive?"#166534":C.txt,
                              background:isActive?"#bbf7d0":"transparent"}}>{f4}</td>
                            <td style={{padding:"9px 14px",fontSize:11,color:isActive?"#166534":C.sub}}>{rationale}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ CABLE CATALOGUE ═════════════════════════════════════════ */}
        {tab==="catalogue" && (
          <div style={{padding:"20px 20px 0"}}>
            <div style={{background:C.warnBg,border:`1px solid ${C.warnBdr}`,borderRadius:6,padding:"10px 16px",marginBottom:12,fontSize:11,color:C.warnTxt}}>
              ⚠ <b>Master / Reference Data</b> — Admin-managed only. Users cannot edit catalogue values. Changes replicated to all calculations automatically.
            </div>
            <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:8,overflow:"hidden"}}>
              <SecHdr>📖 CABLE CATALOGUE — Admin-Managed · IS-8130/1984 · 90°C Rated</SecHdr>
              <div style={{padding:"10px 16px",background:"#f8fafc",borderBottom:`1px solid ${C.bdr}`,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                <b style={{fontSize:11,color:C.sub}}>Filter:</b>
                {[{lbl:"Make",key:"make",opts:MAKE_OPTS},{lbl:"Ins",key:"insulation",opts:INS_OPTS},{lbl:"Cores",key:"cores",opts:CORE_OPTS}].map(f=>(
                  <span key={f.key} style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:10,color:C.muted}}>{f.lbl}:</span>
                    <select value={catFilter[f.key]} onChange={e=>setCatFilter(p=>({...p,[f.key]:isNaN(e.target.value)?e.target.value:Number(e.target.value)}))}
                      style={{padding:"4px 8px",border:`1px solid ${C.bdr}`,borderRadius:4,fontSize:11}}>
                      {f.opts.map(o=>typeof o==="object"?<option key={o.value} value={o.value} disabled={o.disabled??false}>{o.label}</option>:<option key={o} value={o}>{o}</option>)}
                    </select></span>
                ))}
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:C.hdr,color:"#f1f5f9"}}>
                      <th style={thS} rowSpan={2}>Size (mm²)</th>
                      <th style={{...thS,background:"#1e40af"}} colSpan={2}>COPPER (CU)</th>
                      <th style={{...thS,background:"#065f46"}} colSpan={2}>ALUMINIUM (AL)</th>
                      <th style={{...thS,background:"#7c3aed"}} colSpan={3}>IMPEDANCE</th>
                    </tr>
                    <tr style={{background:"#1e293b",color:"#cbd5e1",fontSize:10}}>
                      <th style={{...thS,background:"#1e40af"}}>In Ground (A)</th>
                      <th style={{...thS,background:"#1d4ed8"}}>In Air (A)</th>
                      <th style={{...thS,background:"#065f46"}}>In Ground (A)</th>
                      <th style={{...thS,background:"#0d9488"}}>In Air (A)</th>
                      <th style={{...thS,background:"#7c3aed"}}>R_CU (Ω/km)</th>
                      <th style={{...thS,background:"#6d28d9"}}>R_AL (Ω/km)</th>
                      <th style={{...thS,background:"#5b21b6"}}>X (Ω/km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATALOGUE.filter(c=>c.make===catFilter.make&&c.insulation===catFilter.insulation&&c.cores===catFilter.cores).map((r,i)=>(
                      <tr key={r.size} style={{background:i%2===0?C.surf:"#f8fafc",borderBottom:`1px solid ${C.bdr}`}}>
                        <td style={{padding:"8px 12px",fontWeight:700,color:C.accDk,fontFamily:"monospace",textAlign:"center"}}>{r.size}</td>
                        <td style={{padding:"8px 12px",textAlign:"center",fontFamily:"monospace"}}>{r.cu_gnd}</td>
                        <td style={{padding:"8px 12px",textAlign:"center",fontFamily:"monospace",fontWeight:600}}>{r.cu_air}</td>
                        <td style={{padding:"8px 12px",textAlign:"center",fontFamily:"monospace"}}>{r.al_gnd}</td>
                        <td style={{padding:"8px 12px",textAlign:"center",fontFamily:"monospace",fontWeight:600}}>{r.al_air}</td>
                        <td style={{padding:"8px 12px",textAlign:"center",fontFamily:"monospace",color:"#7c3aed"}}>{r.R_cu}</td>
                        <td style={{padding:"8px 12px",textAlign:"center",fontFamily:"monospace",color:"#7c3aed"}}>{r.R_al}</td>
                        <td style={{padding:"8px 12px",textAlign:"center",fontFamily:"monospace",color:"#5b21b6"}}>{r.X}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ DB SCHEMA ══════════════════════════════════════════════ */}
        {tab==="schema" && (
          <div style={{padding:"20px 20px 0"}}>
            <div style={{background:"#fffbeb",border:`1px solid ${C.warnBdr}`,borderRadius:6,padding:"10px 16px",marginBottom:16,fontSize:12,color:C.warnTxt}}>
              🗄 <b>PostgreSQL Database Schema</b> — All formula logic lives in .NET 8 Application Layer. Users write inputs → backend engine writes results. No business logic in UI or DB.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
              {DB_TABLES.map(tbl=>(
                <div key={tbl.name} style={{background:C.surf,border:`2px solid ${tbl.color}30`,borderRadius:8,overflow:"hidden"}}>
                  <div style={{background:tbl.color,color:"#fff",padding:"9px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13}}>{tbl.name}</span>
                    <span style={{fontSize:10,opacity:0.8}}>{tbl.fields.length} cols</span>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{background:`${tbl.color}10`}}>
                        {["COLUMN","TYPE","NOTE"].map(h=><th key={h} style={{padding:"5px 12px",textAlign:"left",color:C.sub,fontWeight:700,fontSize:10}}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tbl.fields.map(f=>(
                        <tr key={f.c} style={{borderBottom:`1px solid ${C.bdr}`}}>
                          <td style={{padding:"5px 12px",fontFamily:"monospace",fontSize:11,fontWeight:f.pk||f.fk?700:400,
                            color:f.pk?"#dc2626":f.fk?"#7c3aed":C.txt}}>
                            {f.pk?"🔑 ":f.fk?"🔗 ":""}{f.c}
                          </td>
                          <td style={{padding:"5px 12px",fontFamily:"monospace",fontSize:10,color:tbl.color}}>{f.type}</td>
                          <td style={{padding:"5px 12px",fontSize:10,color:C.muted}}>{f.note||""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:8,padding:16,fontSize:12,lineHeight:1.8}}>
              <b>🔐 Security Model:</b> Users write to <code>cable_entries</code> (inputs only). <code>cable_results</code> written solely by CableSizingEngine (backend). Catalogue = Admin role. Results = Read-only for all users.
              <br/><b>🔄 Calculation Flow:</b> User saves row → <code>ProcessCableEntryCommand</code> (MediatR) → <code>CableSizingEngine.Compute()</code> → writes to <code>cable_results</code> → SignalR pushes update to grid.
              <br/><b>📝 Audit:</b> Every save creates a new version in <code>cable_results.calc_version</code>. Full history preserved.
            </div>
          </div>
        )}
      </div>

      {/* FORMULA POPUP */}
      {fPop && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}
          onClick={()=>setFPop(null)}>
          <div style={{background:C.surf,border:`1px solid ${C.calcBdr}`,borderRadius:10,padding:26,maxWidth:540,width:"92%",boxShadow:"0 20px 60px rgba(0,0,0,0.35)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{fontSize:10,color:C.muted,letterSpacing:"0.5px",marginBottom:3}}>FORMULA EXPLANATION — Click anywhere outside to close</div>
                <div style={{fontSize:15,fontWeight:700,color:C.accDk}}>{FMETA[fPop.fKey]?.label??fPop.fKey}</div>
              </div>
              <button onClick={()=>setFPop(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.muted}}>×</button>
            </div>
            {FMETA[fPop.fKey]&&(
              <>
                <div style={{background:C.calcBg,border:`1px solid ${C.calcBdr}`,borderRadius:5,padding:"11px 14px",marginBottom:12,fontFamily:"monospace",fontSize:13,color:C.calcTxt,lineHeight:1.6}}>
                  {FMETA[fPop.fKey].expr}
                </div>
                <div style={{fontSize:12,color:C.sub,lineHeight:1.8,marginBottom:14}}>{FMETA[fPop.fKey].desc}</div>
              </>
            )}
            {fPop.calc&&Object.keys(fPop.calc).length>0&&(
              <div style={{background:"#f8fafc",borderRadius:6,padding:"10px 14px",fontSize:11,fontFamily:"monospace",color:C.sub,lineHeight:1.9,borderTop:`2px solid ${C.calcBdr}`}}>
                <div style={{fontFamily:"sans-serif",fontWeight:700,color:C.sub,marginBottom:5,fontSize:11}}>COMPUTED FOR THIS ROW:</div>
                {fPop.fKey==="flc"&&fPop.calc.flc!=null&&
                  <div>FLC = <span style={{color:C.accDk,fontWeight:700}}>{numFmt(fPop.calc.flc)} A</span></div>}
                {fPop.fKey==="df"&&fPop.calc.dfBreak&&<>
                  <div>F_airTemp = {fPop.calc.dfBreak.fA}</div>
                  <div>F_gndTemp = {fPop.calc.dfBreak.fG}</div>
                  <div>F_group   = {numFmt(fPop.calc.dfBreak.fGrp,4)}</div>
                  <div>F_depth   = {fPop.calc.dfBreak.fDep}</div>
                  <div style={{marginTop:4}}>Combined = <span style={{color:C.accDk,fontWeight:700}}>{fPop.calc.df}</span></div>
                </>}
                {fPop.fKey==="reqR"&&fPop.calc.flc!=null&&
                  <div>I_req = {numFmt(fPop.calc.flc)} ÷ ({fPop.calc.df} × {fPop.calc.runs||1} run{(fPop.calc.runs||1)>1?"s":""}) = <span style={{color:C.accDk,fontWeight:700}}>{numFmt(fPop.calc.reqR,1)} A per cable</span></div>}
                {fPop.fKey==="deratedA"&&fPop.calc.deratedA!=null&&<>
                  <div>Derated = {fPop.calc.baseA} × {fPop.calc.df} × runs</div>
                  <div>= <span style={{color:C.accDk,fontWeight:700}}>{numFmt(fPop.calc.deratedA)} A</span> (FLC = {numFmt(fPop.calc.flc)} A)</div>
                </>}
                {(fPop.fKey==="VD_run"||fPop.fKey==="VD_run_pct")&&fPop.calc.VD_run!=null&&<>
                  <div>VD = I × L × (R·cosφ + X·sinφ) / (runs×1000)</div>
                  <div>= <span style={{color:C.accDk,fontWeight:700}}>{fPop.calc.VD_run} V ({fPop.calc.VD_run_pct}%)</span></div>
                </>}
                {(fPop.fKey==="VD_start"||fPop.fKey==="VD_start_pct")&&fPop.calc.VD_start!=null&&<>
                  <div>VD_s = I × Is_ratio × L × (R·cosφ_s + X·sinφ_s) / (runs×1000)</div>
                  <div>= <span style={{color:C.accDk,fontWeight:700}}>{fPop.calc.VD_start} V ({fPop.calc.VD_start_pct}%)</span></div>
                </>}
              </div>
            )}
            <div style={{textAlign:"right",marginTop:14}}>
              <button className="btn" onClick={()=>setFPop(null)}
                style={{padding:"8px 20px",background:C.acc,color:"#fff",fontSize:12}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS BAR */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.hdr,color:"#64748b",fontSize:10,padding:"4px 24px",display:"flex",justifyContent:"space-between",zIndex:50}}>
        <span>Cable Sizing Safe Web Calculator · v2.0 · Excel→Web Conversion · {rows.length} cables loaded</span>
        <span>Stack: React 18 + .NET 8 + PostgreSQL + Redis · POLYCAB IS-8130/1984 · IS-1554 / IS-732</span>
      </div>
    </div>
  );
}
export default CableSizingApp;