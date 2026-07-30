const FLOWS = [
  {
    id: "pmo-direccion",
    from: "pmo",
    to: "direccion",
    resources: ["estadoConsolidadoAvance", "riesgosEscalados"],
    route: { startSide: "bottom", endSide: "top" },
    label: { position: "near-target", offsetX: -180, offsetY: 5 }
  },
  {
    id: "direccion-rrhh",
    from: "direccion",
    to: "rrhh",
    resources: ["aprobaciones", "presupuesto", "patrocinio", "criteriosRiesgo"],
    route: { startSide: "left", endSide: "top" },
    label: { position: "near-target", offsetX: -2, offsetY: -42 }
  },
  {
    id: "direccion-compliance",
    from: "direccion",
    to: "compliance",
    resources: ["aprobaciones", "presupuesto", "patrocinio", "criteriosRiesgo"],
    route: { startSide: "right", endSide: "top" },
    label: { position: "near-target", offsetX: 2, offsetY: -42 }
  },
  {
    id: "direccion-tecnologia",
    from: "direccion",
    to: "tecnologia",
    resources: ["aprobaciones", "presupuesto", "patrocinio", "criteriosRiesgo"],
    route: { startSide: "bottom", endSide: "top" },
    label: { position: "near-target", offsetX: 112, offsetY: -5 }
  },
  {
    id: "direccion-research",
    from: "direccion",
    to: "research",
    resources: ["aprobaciones", "presupuesto", "patrocinio", "criteriosRiesgo"],
    route: {
      startSide: "left",
      endSide: "top",
      points: [{ x: 30, y: 22 }, { x: 30, y: 62 }, { x: 17, y: 62 }]
    },
    label: { position: "near-target", offsetX: 102, offsetY: -7 }
  },
  {
    id: "direccion-comercial",
    from: "direccion",
    to: "comercial",
    resources: ["aprobaciones", "presupuesto", "patrocinio", "criteriosRiesgo"],
    route: {
      startSide: "right",
      endSide: "top",
      points: [{ x: 70, y: 22 }, { x: 70, y: 62 }, { x: 83, y: 62 }]
    },
    label: { position: "near-target", offsetX: -102, offsetY: -7 }
  },
  {
    id: "direccion-backoffice",
    from: "direccion",
    to: "backoffice",
    resources: ["aprobaciones", "presupuesto", "patrocinio", "criteriosRiesgo"],
    route: {
      startSide: "left",
      endSide: "left",
      points: [{ x: 31, y: 22 }, { x: 31, y: 91 }, { x: 39, y: 91 }, { x: 39, y: 88 }]
    },
    label: { position: "near-target", offsetX: -8, offsetY: -43 }
  },
  {
    id: "compliance-rrhh",
    from: "compliance",
    to: "rrhh",
    resources: ["insumosDiagnosticoBrechas", "validacionModulosCD"],
    route: {
      startSide: "bottom",
      endSide: "bottom",
      points: [{ x: 83, y: 58 }, { x: 17, y: 58 }]
    },
    label: { position: "near-target", offsetX: 106, offsetY: 3 }
  },
  {
    id: "research-rrhh",
    from: "research",
    to: "rrhh",
    resources: ["insumosDiagnosticoBrechas"],
    route: { startSide: "top", endSide: "bottom" },
    label: { position: "near-target", offsetX: -105, offsetY: 0 }
  },
  {
    id: "tecnologia-rrhh",
    from: "tecnologia",
    to: "rrhh",
    resources: ["sandbox", "plataformaFormacion"],
    route: { startSide: "left", endSide: "right" },
    label: { position: "near-target", offsetX: 90, offsetY: 37 }
  },
  {
    id: "comercial-rrhh",
    from: "comercial",
    to: "rrhh",
    resources: ["feedbackAdopcion", "feedbackUsoFormacion"],
    route: {
      startSide: "bottom",
      endSide: "left",
      points: [{ x: 83, y: 80 }, { x: 94, y: 80 }, { x: 5, y: 80 }, { x: 5, y: 42 }]
    },
    label: { position: "near-target", offsetX: -20, offsetY: 46 }
  },
  {
    id: "rrhh-comercial",
    from: "rrhh",
    to: "comercial",
    resources: ["programasFormacionTecnicaHumana", "formacionDual"],
    route: {
      startSide: "bottom",
      endSide: "bottom",
      points: [{ x: 17, y: 83 }, { x: 83, y: 83 }]
    },
    label: { position: "near-target", offsetX: -106, offsetY: 2 }
  },
  {
    id: "rrhh-direccion",
    from: "rrhh",
    to: "direccion",
    resources: ["reportesAdopcion", "clima"],
    route: {
      startSide: "top",
      startOffset: -50,
      endSide: "left",
      endOffset: 26
    },
    label: { position: "near-target", offsetX: -18, offsetY: -46 }
  },
  {
    id: "tecnologia-compliance",
    from: "tecnologia",
    to: "compliance",
    resources: ["disenoTecnicoValidar"],
    route: { startSide: "right", endSide: "bottom" },
    label: { position: "near-target", offsetX: 10, offsetY: 42 }
  },
  {
    id: "research-compliance",
    from: "research",
    to: "compliance",
    resources: ["racionalesAuditar"],
    route: {
      startSide: "left",
      endSide: "right",
      points: [{ x: 4, y: 72 }, { x: 4, y: 32 }, { x: 96, y: 32 }, { x: 96, y: 42 }]
    },
    label: { position: "near-target", offsetX: 8, offsetY: -42 }
  },
  {
    id: "backoffice-compliance",
    from: "backoffice",
    to: "compliance",
    resources: ["reglasRiesgoRevisar"],
    route: {
      startSide: "right",
      endSide: "right",
      points: [{ x: 95, y: 88 }, { x: 95, y: 42 }]
    },
    label: { position: "near-target", offsetX: -5, offsetY: -40 }
  },
  {
    id: "compliance-tecnologia",
    from: "compliance",
    to: "tecnologia",
    resources: ["criteriosHumanInTheLoop", "trazabilidad", "criteriosGobernanza"],
    route: { startSide: "left", endSide: "right" },
    label: { position: "near-target", offsetX: 94, offsetY: -39 }
  },
  {
    id: "compliance-direccion",
    from: "compliance",
    to: "direccion",
    resources: ["riesgoRegulatorio"],
    route: {
      startSide: "top",
      startOffset: 50,
      endSide: "right",
      endOffset: 27
    },
    label: { position: "near-target", offsetX: 120, offsetY: 30 }
  },
  {
    id: "research-tecnologia",
    from: "research",
    to: "tecnologia",
    resources: ["contenidoRacionalesRag", "contenidoCasosUsoEntrenarIa"],
    route: { startSide: "right", endSide: "left" },
    label: { position: "near-target", offsetX: -94, offsetY: 41 }
  },
  {
    id: "backoffice-tecnologia",
    from: "backoffice",
    to: "tecnologia",
    resources: ["reglasNegocioRiesgo", "reglasRiesgoLimitesOperativos"],
    route: {
      startSide: "left",
      endSide: "left",
      points: [{ x: 38, y: 88 }, { x: 38, y: 50 }]
    },
    label: { position: "near-target", offsetX: -4, offsetY: 41 }
  },
  {
    id: "tecnologia-comercial",
    from: "tecnologia",
    to: "comercial",
    resources: ["chatbot", "crm", "herramientas", "chatbotCopiloto"],
    route: { startSide: "right", endSide: "top" },
    label: { position: "near-target", offsetX: 4, offsetY: -42 }
  },
  {
    id: "tecnologia-research",
    from: "tecnologia",
    to: "research",
    resources: ["ragOperativo", "ragHerramientasOperativas"],
    route: { startSide: "bottom", endSide: "right" },
    label: { position: "near-target", offsetX: 93, offsetY: -35 }
  },
  {
    id: "tecnologia-backoffice",
    from: "tecnologia",
    to: "backoffice",
    resources: ["motoresConciliacionReglas", "integracionMotoresConciliacion"],
    route: {
      startSide: "right",
      endSide: "right",
      points: [{ x: 62, y: 50 }, { x: 62, y: 88 }]
    },
    label: { position: "near-target", offsetX: 4, offsetY: -42 }
  },
  {
    id: "research-comercial",
    from: "research",
    to: "comercial",
    resources: ["racionalesInversionResearch", "contenidoRacionales"],
    route: {
      startSide: "bottom",
      endSide: "left",
      points: [{ x: 17, y: 78 }, { x: 72, y: 78 }, { x: 72, y: 72 }]
    },
    label: { position: "near-target", offsetX: -8, offsetY: 43 }
  },
  {
    id: "comercial-direccion",
    from: "comercial",
    to: "direccion",
    resources: ["nps", "retencion", "adopcionReal"],
    route: {
      startSide: "right",
      endSide: "right",
      endOffset: -27,
      points: [{ x: 97, y: 72 }, { x: 97, y: 18 }]
    },
    label: { position: "near-target", offsetX: 133, offsetY: -43 }
  },
  {
    id: "backoffice-comercial",
    from: "backoffice",
    to: "comercial",
    resources: ["ejecucionRebalanceosAprobados"],
    route: { startSide: "right", endSide: "bottom" },
    label: { position: "near-target", offsetX: 8, offsetY: 42 }
  }
];

const FLOW_GROUPS = {
  direccionTodosSectores: {
    title: "Todos los sectores",
    from: "direccion",
    flowIds: [
      "direccion-rrhh",
      "direccion-compliance",
      "direccion-tecnologia",
      "direccion-research",
      "direccion-comercial",
      "direccion-backoffice"
    ],
    position: { x: 50, y: 32.5 },
    route: { startSide: "bottom", endSide: "top", spacing: 3 },
    distribution: {
      junction: { x: 50, y: 39 },
      startSide: "bottom",
      spine: {
        from: { x: 36, y: 39 },
        to: { x: 64, y: 39 }
      }
    },
    branchRoutes: {
      "direccion-rrhh": {
        start: { x: 36, y: 39 },
        endSide: "right"
      },
      "direccion-compliance": {
        start: { x: 64, y: 39 },
        endSide: "left"
      },
      "direccion-tecnologia": {
        start: { x: 50, y: 39 },
        endSide: "top"
      },
      "direccion-research": {
        start: { x: 36, y: 39 },
        endSide: "top"
      },
      "direccion-comercial": {
        start: { x: 64, y: 39 },
        endSide: "top"
      },
      "direccion-backoffice": {
        start: { x: 38, y: 39 },
        endSide: "left",
        points: [
          { x: 38, y: 39 },
          { x: 38, y: 88 }
        ]
      }
    }
  }
};
