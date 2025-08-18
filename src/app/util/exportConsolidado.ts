import type * as XLSX from 'xlsx';

export interface Session { id: number; title: string | null; number: number }
export interface Competency { id: number; display_name: string; session_id: number }
export interface Ability { id: number; display_name: string; competency_id: number }
export interface Criterion { id: number; display_name: string; ability_id: number }
export interface Student { id: number; full_name: string }
export interface Value { student_id: number; criterion_id: number; value: string }
export interface Observation { student_id: number; ability_id: number; observation: string }

export interface ConsolidadoResponse {
  students: Student[];
  sessions: Session[];
  competencies: Competency[];
  abilities: Ability[];
  criteria: Criterion[];
  values: Value[];
  observations: Observation[];
}

export interface ExportOptions {
  fileName?: string;
  calcularPromedios?: boolean;
  hojaObservaciones?: boolean;
  mostrarIcono?: boolean;        // Mostrar el símbolo 📝 (default true)
  // Colores
  colorSesion?: string;
  colorCompetencia?: string;
  colorHabilidad?: string;
  colorFixedCols?: string;
  colorObs?: string;
  borderColor?: string;
}

const escala: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };

export async function exportConsolidadoExcel(
  data: ConsolidadoResponse,
  opts: ExportOptions = {}
) {
  const {
    fileName = "consolidado.xlsx",
    calcularPromedios = false,
    hojaObservaciones = true,
    mostrarIcono = true,
    colorSesion = "FFF2F3F5",
    colorCompetencia = "FFF2F3F5",
    colorHabilidad = "FFE8EAED",
    colorFixedCols = "FFE8EAED",
    colorObs = "FFFFF9C4",
    borderColor = "FF444444",
  } = opts;

  const XLSX = await import("xlsx");

  // ---- Agrupaciones ----
  const sessions = [...data.sessions].sort((a,b)=>a.number - b.number);
  const compsPorSesion: Record<number, Competency[]> = {};
  data.competencies.forEach(c => (compsPorSesion[c.session_id] ||= []).push(c));
  Object.values(compsPorSesion).forEach(l => l.sort((a,b)=>a.display_name.localeCompare(b.display_name)));

  const abilitiesPorComp: Record<number, Ability[]> = {};
  data.abilities.forEach(a => (abilitiesPorComp[a.competency_id] ||= []).push(a));
  Object.values(abilitiesPorComp).forEach(l => l.sort((a,b)=>a.display_name.localeCompare(b.display_name)));

  const criteriosPorAbility: Record<number, Criterion[]> = {};
  data.criteria.forEach(cr => (criteriosPorAbility[cr.ability_id] ||= []).push(cr));
  Object.values(criteriosPorAbility).forEach(l => l.sort((a,b)=>a.display_name.localeCompare(b.display_name)));

  const students = [...data.students].sort((a,b)=>a.full_name.localeCompare(b.full_name));
  const abilityMap: Record<number, Ability> = {};
  data.abilities.forEach(a => abilityMap[a.id] = a);

  const obsMap: Record<string,string> = {};
  data.observations.forEach(o => {
    if (o.observation) obsMap[`${o.student_id}-${o.ability_id}`] = o.observation;
  });

  // ---- Matrices / metas ----
  const HEADER_ROWS = 4;
  const sheet: any[][] = Array.from({length: HEADER_ROWS}, () => []);
  const criterionByCol: Record<number, number> = {};
  const abilityObsCol: Record<number, number> = {};
  const abilityAvgCol: Record<number, number> = {}; // NUEVO: columna promedio por capacidad
  const compAvgCols: number[] = [];

  sheet[0][0] = "N°";
  sheet[0][1] = "APELLIDOS Y NOMBRES";
  for (let r=1;r<HEADER_ROWS;r++){ sheet[r][0] = ""; sheet[r][1] = ""; }

  const merges: XLSX.Range[] = [
    { s:{r:0,c:0}, e:{r:3,c:0} },
    { s:{r:0,c:1}, e:{r:3,c:1} },
  ];

  let col = 2;

  interface AbilityBlock {
    abilityId: number;
    critCols: number[];
    obsCol: number;
    avgCol: number;
  }
  interface CompetencyBlock {
    avgCol: number;
    abilityBlocks: AbilityBlock[];
  }
  const competencyBlocks: CompetencyBlock[] = [];

  // ---- Encabezado jerárquico ----
  for (const ses of sessions) {
    const sesStart = col;
    const compList = compsPorSesion[ses.id] || [];
    for (const comp of compList) {
      const compStart = col;
      const abilityBlocks: AbilityBlock[] = [];
      const abList = abilitiesPorComp[comp.id] || [];

      for (const ab of abList) {
        const crits = criteriosPorAbility[ab.id] || [];
        const abilityCritStart = col;
        const critCols: number[] = [];

        for (const cr of crits) {
          sheet[3][col] = cr.display_name;
          criterionByCol[col] = cr.id;
          critCols.push(col);
          col++;
        }

        const obsCol = col;
        sheet[3][obsCol] = mostrarIcono ? "📝" : "";  // icono opcional
        abilityObsCol[obsCol] = ab.id;

        if (crits.length > 0) {
          sheet[2][abilityCritStart] = ab.display_name;
          if (crits.length > 1) {
            merges.push({
              s:{r:2,c:abilityCritStart},
              e:{r:2,c:abilityCritStart + critCols.length -1}
            });
          }
        } else {
          sheet[2][obsCol] = ab.display_name;
        }
        col++;

        // NUEVO: columna promedio capacidad
        const avgCol = col;
        sheet[2][avgCol] = "PROMED CAP.";
        sheet[3][avgCol] = "";
        abilityAvgCol[avgCol] = ab.id;
        merges.push({ s:{r:2,c:avgCol}, e:{r:3,c:avgCol} });
        col++;

        abilityBlocks.push({ abilityId: ab.id, critCols, obsCol, avgCol });
      }

      const avgCol = col;
      sheet[2][avgCol] = "PROMED";
      sheet[3][avgCol] = "";
      compAvgCols.push(avgCol);
      merges.push({ s:{r:2,c:avgCol}, e:{r:3,c:avgCol} });
      col++;

      merges.push({ s:{r:1,c:compStart}, e:{r:1,c:col-1} });
      sheet[1][compStart] = comp.display_name;

      competencyBlocks.push({ avgCol, abilityBlocks });
    }
    merges.push({ s:{r:0,c:sesStart}, e:{r:0,c:col-1} });
    sheet[0][sesStart] = ses.title || `S${ses.number}`;
  }

  // ---- Filas de estudiantes ----
  for (let i=0;i<students.length;i++) {
    const st = students[i];
    const row: any[] = [];
    row[0] = i+1;
    row[1] = st.full_name;

    for (let c=2; c<col; c++) {
      if (criterionByCol[c] !== undefined) {
        const critId = criterionByCol[c];
        const v = data.values.find(v => v.student_id === st.id && v.criterion_id === critId);
        row[c] = v ? v.value : "";
      } else if (abilityObsCol[c] !== undefined) {
        const abId = abilityObsCol[c];
        row[c] = obsMap[`${st.id}-${abId}`] ? (mostrarIcono ? "📝" : "") : "";
      } else if (abilityAvgCol[c] !== undefined) {
        // Promedio por capacidad (vacío si no calcularPromedios)
        if (calcularPromedios) {
          const abId = abilityAvgCol[c];
          const critCols = Object.entries(criterionByCol)
            .filter(([, id]) => data.abilities.find(a => a.id === abId)?.id === abId)
            .map(([colStr]) => parseInt(colStr));
          const nums: number[] = [];
          for (const k of critCols) {
            const critId = criterionByCol[k];
            const v = data.values.find(vv => vv.student_id === st.id && vv.criterion_id === critId);
            if (v && escala[v.value] !== undefined) nums.push(escala[v.value]);
          }
          row[c] = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2) : "";
        } else {
          row[c] = "";
        }
      } else if (compAvgCols.includes(c)) {
        if (calcularPromedios) {
          const block = competencyBlocks.find(b => b.avgCol === c);
          if (block) {
            const nums: number[] = [];
            for (const abBlock of block.abilityBlocks) {
              for (const k of abBlock.critCols) {
                const critId = criterionByCol[k];
                const v = data.values.find(vv => vv.student_id === st.id && vv.criterion_id === critId);
                if (v && escala[v.value] !== undefined) nums.push(escala[v.value]);
              }
            }
            row[c] = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2) : "";
          } else {
            row[c] = "";
          }
        } else {
          row[c] = "";
        }
      } else {
        row[c] = "";
      }
    }
    sheet.push(row);
  }

  // ---- Hoja principal ----
  const ws = XLSX.utils.aoa_to_sheet(sheet);
  (ws as any)["!merges"] = merges;

  // ---- Estilos ----
  const borderStyle = {
    top:    { style: "thin", color: { rgb: borderColor.slice(2) } },
    bottom: { style: "thin", color: { rgb: borderColor.slice(2) } },
    left:   { style: "thin", color: { rgb: borderColor.slice(2) } },
    right:  { style: "thin", color: { rgb: borderColor.slice(2) } },
  };

  function setStyle(r:number,c:number,opts:{
    fill?:string; bold?:boolean; align?: "center"|"left"|"right"; vertical?:boolean;
  }={}) {
    const ref = XLSX.utils.encode_cell({r,c});
    if (!ws[ref]) return;
    ws[ref].s = ws[ref].s || {};
    ws[ref].s.border = borderStyle;
    ws[ref].s.alignment = ws[ref].s.alignment || {};
    ws[ref].s.alignment.vertical = "center";
    if (opts.align) ws[ref].s.alignment.horizontal = opts.align;
    if (opts.vertical) ws[ref].s.alignment.textRotation = 90;
    if (opts.fill) {
      ws[ref].s.fill = {
        patternType:"solid",
        fgColor:{rgb:opts.fill.replace(/^FF/i,'').replace(/^#/,'')}
      };
    }
    if (opts.bold) {
      ws[ref].s.font = Object.assign({}, ws[ref].s.font, { bold:true });
    }
  }

  for (let r=0;r<HEADER_ROWS;r++){
    setStyle(r,0,{fill:colorFixedCols,bold:true,align:"center"});
    setStyle(r,1,{fill:colorFixedCols,bold:true,align:"center"});
  }
  merges.filter(m=>m.s.r===0).forEach(m=>{
    for (let c=m.s.c;c<=m.e.c;c++) setStyle(0,c,{fill:colorSesion,bold:true,align:"center"});
  });
  merges.filter(m=>m.s.r===1).forEach(m=>{
    for (let c=m.s.c;c<=m.e.c;c++) setStyle(1,c,{fill:colorCompetencia,bold:true,align:"center"});
  });
  merges.filter(m=>m.s.r===2 && m.e.r===2).forEach(m=>{
    for (let c=m.s.c;c<=m.e.c;c++) setStyle(2,c,{fill:colorHabilidad,bold:true,align:"center"});
  });
  compAvgCols.forEach(c=>{
    setStyle(2,c,{fill:colorHabilidad,bold:true,align:"center",vertical:true});
    setStyle(3,c,{fill:colorHabilidad,bold:true,align:"center",vertical:true});
  });
  Object.keys(criterionByCol).forEach(cStr=>{
    setStyle(3,parseInt(cStr,10),{fill:"FFFFFFFF",bold:true,align:"center"});
  });
  Object.keys(abilityObsCol).forEach(cStr=>{
    setStyle(3,parseInt(cStr,10),{fill:colorObs,align:"center"});
  });
  Object.keys(abilityAvgCol).forEach(cStr=>{
    setStyle(2,parseInt(cStr,10),{fill:"FFDEECF7",bold:true,align:"center",vertical:true});
    setStyle(3,parseInt(cStr,10),{fill:"FFDEECF7",bold:true,align:"center",vertical:true});
  });
  for (let r=HEADER_ROWS;r<sheet.length;r++){
    for (let c=0;c<col;c++){
      const ref = XLSX.utils.encode_cell({r,c});
      if (!ws[ref]) continue;
      ws[ref].s = ws[ref].s || {};
      ws[ref].s.border = borderStyle;
      ws[ref].s.alignment = ws[ref].s.alignment || {};
      ws[ref].s.alignment.vertical = "center";
      ws[ref].s.alignment.horizontal = c===0 ? "center" : (c===1 ? "left" : "center");
    }
  }

  // ---- Hoja Observaciones + hipervínculos ----
  let wsObs: XLSX.WorkSheet | null = null;
  const obsKeyToRow: Record<string, number> = {};
  if (hojaObservaciones) {
    const obsRows: any[][] = [["Alumno","Habilidad","Observación"]];
    data.observations
      .filter(o => !!o.observation)
      .sort((a,b)=>{
        const sa = students.find(s=>s.id===a.student_id)!.full_name.localeCompare(
          students.find(s=>s.id===b.student_id)!.full_name
        );
        if (sa !==0) return sa;
        return abilityMap[a.ability_id].display_name.localeCompare(
          abilityMap[b.ability_id].display_name
        );
      })
      .forEach(o=>{
        const st = students.find(s=>s.id===o.student_id)!;
        const ab = abilityMap[o.ability_id];
        obsKeyToRow[`${o.student_id}-${o.ability_id}`] = obsRows.length; // row index (0-based) before creation
        obsRows.push([st.full_name, ab.display_name, o.observation]);
      });

    wsObs = XLSX.utils.aoa_to_sheet(obsRows);
    (wsObs as any)["!cols"] = [
      { wch: 28 }, { wch: 28 }, { wch: 70 }
    ];
    // Estilos simples
    const range = XLSX.utils.decode_range(wsObs["!ref"]!);
    const bThin = {
      top:{style:"thin",color:{rgb:"444444"}},
      bottom:{style:"thin",color:{rgb:"444444"}},
      left:{style:"thin",color:{rgb:"444444"}},
      right:{style:"thin",color:{rgb:"444444"}},
    };
    for (let R=range.s.r; R<=range.e.r; R++) {
      for (let C=range.s.c; C<=range.e.c; C++) {
        const ref = XLSX.utils.encode_cell({r:R,c:C});
        if (!wsObs[ref]) continue;
        wsObs[ref].s = wsObs[ref].s || {};
        wsObs[ref].s.border = bThin;
        wsObs[ref].s.alignment = { vertical:"top", horizontal: C===2?"left":"center", wrapText:true };
        if (R===0) {
          wsObs[ref].s.fill = { patternType:"solid", fgColor:{rgb:"E8EAED"} };
          wsObs[ref].s.font = { bold:true };
        }
      }
    }
  }

  // ---- Hipervínculos con tooltip (truncado) en celdas de observación ----
  for (let r = HEADER_ROWS; r < sheet.length; r++) {
    const student = students[r - HEADER_ROWS];
    for (const cStr in abilityObsCol) {
      const c = Number(cStr);
      const ref = XLSX.utils.encode_cell({r,c});
      if (!ws[ref] || ws[ref].v === "" ) continue;
      const abilityId = abilityObsCol[c];
      const fullText = obsMap[`${student.id}-${abilityId}`];
      if (!fullText) continue;

      // Tooltip recortado para no ser intrusivo
      const short = fullText.length > 120 ? fullText.slice(0,117)+"..." : fullText;

      if (hojaObservaciones && wsObs) {
        const obsRow = obsKeyToRow[`${student.id}-${abilityId}`];
        if (obsRow !== undefined) {
          const excelRow1 = obsRow + 1; // 1-based
          ws[ref].l = {
            Target: `#'Observaciones'!A${excelRow1}`,
            Tooltip: short
          };
        } else {
          // fallback: sin hoja observaciones => hyperlink "vacío" con tooltip
          ws[ref].l = {
            Target: "#",
            Tooltip: short
          };
        }
      } else {
        // Sólo tooltip sin saltar a otra hoja
        ws[ref].l = { Target: "#", Tooltip: short };
      }
    }
  }

  // ---- Columnas y filas ----
  (ws as any)["!cols"] = Array.from({length: col}, (_,i)=> {
    if (i===0) return { wch: 4 };
    if (i===1) return { wch: 28 };
    return { wch: 12 };
  });
  (ws as any)["!rows"] = [
    { hpt: 22 },
    { hpt: 20 },
    { hpt: 30 },
    { hpt: 22 },
  ];

  // ---- Libro ----
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Consolidado");
  if (hojaObservaciones && wsObs) {
    XLSX.utils.book_append_sheet(wb, wsObs, "Observaciones");
  }

  XLSX.writeFile(wb, fileName, { compression: true });
}