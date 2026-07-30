(function () {
  "use strict";

  const datos =
    Presentacion.diapositivas.interconexiones &&
    Presentacion.diapositivas.interconexiones.datos;
  const DEPARTMENTS = datos.sectores;
  const RESOURCES = datos.recursos;
  const FLOWS = datos.flujos;
  const FLOW_GROUPS = datos.gruposFlujo;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SIDES = new Set(["top", "right", "bottom", "left"]);
  const FLOW_MODES = new Set(["all", "incoming", "outgoing"]);
  const departmentIds = Object.keys(DEPARTMENTS);
  const flowGroups = FLOW_GROUPS || {};

  let root = null;
  let context = null;
  let elements = null;
  let departmentNodes = new Map();
  let cleanups = [];
  let selectedDepartment = null;
  let flowMode = "all";
  let isInfoPanelOpen = true;
  let redrawTimer = null;
  let redrawFrame = null;
  let resizeObserver = null;

  function listen(node, eventName, handler) {
    node.addEventListener(eventName, handler);
    cleanups.push(function () {
      node.removeEventListener(eventName, handler);
    });
  }

  function createStructure(targetRoot, slideContext) {
    const theme = document.createElement("section");
    const resetButton = document.createElement("button");

    theme.className = "tema-interconexiones";
    theme.innerHTML = `
      <div class="workspace">
        <section class="map-card" aria-labelledby="map-title">
          <div class="map-card__header">
            <div>
              <h2 id="map-title">Mapa de relaciones</h2>
              <p id="map-status" aria-live="polite">Seleccioná un sector</p>
            </div>
            <div class="map-key" aria-label="Leyenda">
              <span><i class="key-line" aria-hidden="true"></i> Origen</span>
              <span><i class="key-arrow" aria-hidden="true">→</i> Destino</span>
            </div>
          </div>

          <div class="map-viewport" id="map-viewport">
            <div class="map-stage" id="map-stage">
              <div
                class="flow-filter"
                id="flow-filter"
                role="group"
                aria-label="Filtrar conexiones del sector seleccionado"
              >
                <button
                  class="flow-filter__button is-active"
                  type="button"
                  data-flow-mode="all"
                  aria-pressed="true"
                  aria-label="Mostrar todas las conexiones del sector"
                  disabled
                >
                  Todas
                </button>
                <button
                  class="flow-filter__button"
                  type="button"
                  data-flow-mode="incoming"
                  aria-pressed="false"
                  aria-label="Mostrar solamente lo que recibe el sector"
                  disabled
                >
                  Recibe
                </button>
                <button
                  class="flow-filter__button"
                  type="button"
                  data-flow-mode="outgoing"
                  aria-pressed="false"
                  aria-label="Mostrar solamente lo que entrega el sector"
                  disabled
                >
                  Entrega
                </button>
              </div>
              <svg
                class="connections"
                id="connections"
                aria-hidden="true"
                focusable="false"
              ></svg>
              <div class="flow-labels" id="flow-labels" aria-hidden="true"></div>
              <div class="departments" id="departments"></div>
              <p class="map-prompt" id="map-prompt">
                <span aria-hidden="true">↗</span>
                Seleccioná un sector para explorar sus conexiones
              </p>
            </div>
          </div>

          <p class="keyboard-help">
            <strong>Teclado:</strong> ← y → recorren sectores · Enter selecciona ·
            AvPág y RePág avanzan el guion · M abre el índice · P activa el modo
            presentación
          </p>
        </section>

        <aside class="info-panel" id="info-panel" tabindex="-1">
          <button
            class="info-toggle"
            id="info-toggle"
            type="button"
            aria-controls="info-content"
            aria-expanded="true"
            aria-label="Cerrar panel informativo"
            title="Cerrar panel informativo"
          >
            <span aria-hidden="true">»</span>
          </button>
          <div id="info-content" aria-live="polite"></div>
        </aside>
      </div>
    `;

    resetButton.className = "presentacion-control";
    resetButton.type = "button";
    resetButton.innerHTML = '<span aria-hidden="true">↺</span> Restablecer mapa';
    slideContext.establecerAcciones([resetButton]);
    targetRoot.appendChild(theme);

    root = theme;
    elements = {
      stage: root.querySelector("#map-stage"),
      viewport: root.querySelector("#map-viewport"),
      svg: root.querySelector("#connections"),
      labels: root.querySelector("#flow-labels"),
      departments: root.querySelector("#departments"),
      flowFilterButtons: Array.from(
        root.querySelectorAll("[data-flow-mode]")
      ),
      prompt: root.querySelector("#map-prompt"),
      status: root.querySelector("#map-status"),
      reset: resetButton,
      workspace: root.querySelector(".workspace"),
      infoPanel: root.querySelector("#info-panel"),
      infoToggle: root.querySelector("#info-toggle"),
      info: root.querySelector("#info-content")
    };
  }

  function isValidPercentagePoint(point) {
    return (
      point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.x >= 0 &&
      point.x <= 100 &&
      point.y >= 0 &&
      point.y <= 100
    );
  }

  function validateData() {
    const errors = [];
    const seenDepartmentIds = new Set();
    const seenFlowIds = new Set();
    const seenPairs = new Set();

    departmentIds.forEach(function (id) {
      if (seenDepartmentIds.has(id)) {
        errors.push('El identificador de departamento "' + id + '" está duplicado.');
      }
      seenDepartmentIds.add(id);
    });

    FLOWS.forEach(function (flow, index) {
      const reference = flow.id || "en la posición " + index;

      if (!flow.id || seenFlowIds.has(flow.id)) {
        errors.push(
          flow.id
            ? 'El identificador de flujo "' + flow.id + '" está duplicado.'
            : "Hay un flujo sin identificador en la posición " + index + "."
        );
      }
      if (flow.id) {
        seenFlowIds.add(flow.id);
      }

      if (!flow.from || !flow.to) {
        errors.push("El flujo " + reference + " tiene origen o destino vacío.");
      } else {
        if (!DEPARTMENTS[flow.from]) {
          errors.push(
            "El flujo " + reference + ' referencia el origen inexistente "' + flow.from + '".'
          );
        }
        if (!DEPARTMENTS[flow.to]) {
          errors.push(
            "El flujo " + reference + ' referencia el destino inexistente "' + flow.to + '".'
          );
        }

        const pair = flow.from + "→" + flow.to;
        if (seenPairs.has(pair)) {
          errors.push(
            "Existe más de un flujo para la pareja ordenada " + pair + "."
          );
        }
        seenPairs.add(pair);
      }

      if (!Array.isArray(flow.resources) || flow.resources.length === 0) {
        errors.push("El flujo " + reference + " no tiene recursos.");
      } else {
        flow.resources.forEach(function (resourceId) {
          if (!RESOURCES[resourceId]) {
            errors.push(
              "El flujo " +
                reference +
                ' referencia el recurso inexistente "' +
                resourceId +
                '".'
            );
          }
        });
      }

      if (flow.route) {
        if (
          flow.route.startSide &&
          !SIDES.has(flow.route.startSide)
        ) {
          errors.push(
            "El flujo " + reference + " tiene un lado de salida inválido."
          );
        }
        if (flow.route.endSide && !SIDES.has(flow.route.endSide)) {
          errors.push(
            "El flujo " + reference + " tiene un lado de entrada inválido."
          );
        }
        if (flow.route.points && !Array.isArray(flow.route.points)) {
          errors.push(
            "El flujo " + reference + " tiene puntos manuales inválidos."
          );
        }
        ["startOffset", "endOffset"].forEach(function (key) {
          if (
            flow.route[key] !== undefined &&
            !Number.isFinite(flow.route[key])
          ) {
            errors.push(
              "El flujo " + reference + " tiene un " + key + " inválido."
            );
          }
        });
        (flow.route.points || []).forEach(function (point, pointIndex) {
          const validPoint =
            point &&
            Number.isFinite(point.x) &&
            Number.isFinite(point.y) &&
            point.x >= 0 &&
            point.x <= 100 &&
            point.y >= 0 &&
            point.y <= 100;
          if (!validPoint) {
            errors.push(
              "El punto manual " +
                (pointIndex + 1) +
                " del flujo " +
                reference +
                " tiene coordenadas inválidas."
            );
          }
        });
      }
    });

    const flowsById = new Map(
      FLOWS.map(function (flow) {
        return [flow.id, flow];
      })
    );

    Object.keys(flowGroups).forEach(function (groupId) {
      const group = flowGroups[groupId];
      const groupFlows = (group.flowIds || [])
        .map(function (flowId) {
          return flowsById.get(flowId);
        })
        .filter(Boolean);

      if (!group.title || !DEPARTMENTS[group.from]) {
        errors.push(
          'El grupo visual "' + groupId + '" tiene título u origen inválido.'
        );
      }
      if (!Array.isArray(group.flowIds) || group.flowIds.length < 2) {
        errors.push(
          'El grupo visual "' + groupId + '" debe contener al menos dos flujos.'
        );
      } else if (new Set(group.flowIds).size !== group.flowIds.length) {
        errors.push(
          'El grupo visual "' + groupId + '" contiene flujos duplicados.'
        );
      }
      (group.flowIds || []).forEach(function (flowId) {
        const flow = flowsById.get(flowId);
        if (!flow) {
          errors.push(
            'El grupo visual "' + groupId + '" referencia el flujo inexistente "' + flowId + '".'
          );
        } else if (flow.from !== group.from) {
          errors.push(
            'El flujo "' + flowId + '" no comparte el origen del grupo "' + groupId + '".'
          );
        }
      });
      if (
        !group.position ||
        !Number.isFinite(group.position.x) ||
        !Number.isFinite(group.position.y) ||
        group.position.x < 0 ||
        group.position.x > 100 ||
        group.position.y < 0 ||
        group.position.y > 100
      ) {
        errors.push(
          'El grupo visual "' + groupId + '" tiene una posición inválida.'
        );
      }
      if (group.distribution) {
        const junction = group.distribution.junction;
        if (
          !isValidPercentagePoint(junction) ||
          (group.distribution.startSide &&
            !SIDES.has(group.distribution.startSide))
        ) {
          errors.push(
            'El grupo visual "' + groupId + '" tiene un distribuidor inválido.'
          );
        }
        if (
          group.distribution.spine &&
          (!isValidPercentagePoint(group.distribution.spine.from) ||
            !isValidPercentagePoint(group.distribution.spine.to))
        ) {
          errors.push(
            'El grupo visual "' + groupId + '" tiene una barra distribuidora inválida.'
          );
        }
      }
      Object.keys(group.branchRoutes || {}).forEach(function (flowId) {
        const branchRoute = group.branchRoutes[flowId];
        if (!(group.flowIds || []).includes(flowId)) {
          errors.push(
            'La ruta del grupo visual "' + groupId + '" referencia un flujo ajeno.'
          );
        }
        if (
          (branchRoute.startSide && !SIDES.has(branchRoute.startSide)) ||
          (branchRoute.endSide && !SIDES.has(branchRoute.endSide)) ||
          (branchRoute.start &&
            !isValidPercentagePoint(branchRoute.start))
        ) {
          errors.push(
            'La ruta del flujo "' + flowId + '" dentro del grupo visual es inválida.'
          );
        }
        (branchRoute.points || []).forEach(function (point) {
          if (
            !Number.isFinite(point.x) ||
            !Number.isFinite(point.y) ||
            point.x < 0 ||
            point.x > 100 ||
            point.y < 0 ||
            point.y > 100
          ) {
            errors.push(
              'La ruta del flujo "' + flowId + '" dentro del grupo visual tiene puntos inválidos.'
            );
          }
        });
      });
      if (groupFlows.length > 1) {
        const resourceSignature = groupFlows[0].resources.join("|");
        groupFlows.slice(1).forEach(function (flow) {
          if (flow.resources.join("|") !== resourceSignature) {
            errors.push(
              'Los flujos del grupo visual "' + groupId + '" no comparten los mismos recursos.'
            );
          }
        });
      }
    });

    errors.forEach(function (message) {
      console.error(message);
    });

    return errors;
  }

  function getFlowsFor(departmentId) {
    return FLOWS.filter(function (flow) {
      return flow.from === departmentId || flow.to === departmentId;
    });
  }

  function getVisibleFlowsFor(departmentId) {
    return getFlowsFor(departmentId).filter(function (flow) {
      if (flowMode === "incoming") {
        return flow.to === departmentId;
      }
      if (flowMode === "outgoing") {
        return flow.from === departmentId;
      }
      return true;
    });
  }

  function getRelatedDepartments(departmentId) {
    const related = new Set();
    getVisibleFlowsFor(departmentId).forEach(function (flow) {
      related.add(flow.from === departmentId ? flow.to : flow.from);
    });
    return related;
  }

  function getActiveFlowGroups(departmentId, visibleFlows) {
    const visibleIds = new Set(
      visibleFlows.map(function (flow) {
        return flow.id;
      })
    );

    return Object.keys(flowGroups)
      .map(function (groupId) {
        return flowGroups[groupId];
      })
      .filter(function (group) {
        return (
          group.from === departmentId &&
          group.flowIds.length > 1 &&
          group.flowIds.every(function (flowId) {
            return visibleIds.has(flowId);
          })
        );
      });
  }

  function createDepartments() {
    const fragment = document.createDocumentFragment();

    departmentIds.forEach(function (id, index) {
      const department = DEPARTMENTS[id];
      const connectionCount = getFlowsFor(id).length;
      const button = document.createElement("button");
      const name = document.createElement("span");
      const count = document.createElement("span");

      button.type = "button";
      button.id = "department-" + id;
      button.className =
        "department" + (department.external ? " department--external" : "");
      button.dataset.departmentId = id;
      button.style.left = department.position.x + "%";
      button.style.top = department.position.y + "%";
      button.style.setProperty("--department-color", department.color);
      button.setAttribute(
        "aria-label",
        department.name +
          ". " +
          connectionCount +
          (connectionCount === 1 ? " conexión asociada." : " conexiones asociadas.")
      );

      name.className = "department__name";
      name.textContent = department.name;
      count.className = "department__count";
      count.textContent =
        connectionCount + (connectionCount === 1 ? " conexión" : " conexiones");

      button.appendChild(name);
      if (!department.external) {
        button.appendChild(count);
      }

      listen(button, "click", function () {
        selectDepartment(id);
      });
      departmentNodes.set(id, button);
      fragment.appendChild(button);
    });

    elements.departments.appendChild(fragment);
  }

  function handleDepartmentKeydown(event, index) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const movement = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (index + movement + departmentIds.length) % departmentIds.length;
    const nextNode = departmentNodes.get(departmentIds[nextIndex]);
    if (nextNode) {
      nextNode.focus();
    }
  }

  function getDepartmentBox(id) {
    const stageBox = elements.stage.getBoundingClientRect();
    const node = departmentNodes.get(id);
    if (!node) {
      throw new Error('No se encontró el sector "' + id + '" dentro del mapa.');
    }
    const nodeBox = node.getBoundingClientRect();

    return {
      x: nodeBox.left - stageBox.left + nodeBox.width / 2,
      y: nodeBox.top - stageBox.top + nodeBox.height / 2,
      width: nodeBox.width,
      height: nodeBox.height
    };
  }

  function getElementBox(element) {
    const stageBox = elements.stage.getBoundingClientRect();
    const elementBox = element.getBoundingClientRect();

    return {
      x: elementBox.left - stageBox.left + elementBox.width / 2,
      y: elementBox.top - stageBox.top + elementBox.height / 2,
      width: elementBox.width,
      height: elementBox.height
    };
  }

  function getAnchor(box, side) {
    if (side === "top") {
      return { x: box.x, y: box.y - box.height / 2 };
    }
    if (side === "right") {
      return { x: box.x + box.width / 2, y: box.y };
    }
    if (side === "bottom") {
      return { x: box.x, y: box.y + box.height / 2 };
    }
    return { x: box.x - box.width / 2, y: box.y };
  }

  function offsetAlongSide(point, box, side, offset) {
    const amount = Number(offset) || 0;

    if (!amount) {
      return point;
    }

    const isHorizontalSide = side === "left" || side === "right";
    const limit = Math.max(
      0,
      (isHorizontalSide ? box.height : box.width) / 2 - 8
    );
    const clamped = Math.max(-limit, Math.min(limit, amount));

    return isHorizontalSide
      ? { x: point.x, y: point.y + clamped }
      : { x: point.x + clamped, y: point.y };
  }

  function getSideVector(side) {
    if (side === "top") {
      return { x: 0, y: -1 };
    }
    if (side === "right") {
      return { x: 1, y: 0 };
    }
    if (side === "bottom") {
      return { x: 0, y: 1 };
    }
    return { x: -1, y: 0 };
  }

  function inferSides(fromBox, toBox) {
    const dx = toBox.x - fromBox.x;
    const dy = toBox.y - fromBox.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0
        ? { startSide: "right", endSide: "left" }
        : { startSide: "left", endSide: "right" };
    }

    return dy >= 0
      ? { startSide: "bottom", endSide: "top" }
      : { startSide: "top", endSide: "bottom" };
  }

  function addPoint(points, point) {
    const previous = points[points.length - 1];
    if (
      !previous ||
      Math.abs(previous.x - point.x) > 0.5 ||
      Math.abs(previous.y - point.y) > 0.5
    ) {
      points.push(point);
    }
  }

  function automaticElbows(start, end, startSide, endSide) {
    const startIsHorizontal = startSide === "left" || startSide === "right";
    const endIsHorizontal = endSide === "left" || endSide === "right";

    if (Math.abs(start.x - end.x) < 0.5 || Math.abs(start.y - end.y) < 0.5) {
      return [];
    }
    if (startIsHorizontal && endIsHorizontal) {
      const middleX = (start.x + end.x) / 2;
      return [
        { x: middleX, y: start.y },
        { x: middleX, y: end.y }
      ];
    }
    if (!startIsHorizontal && !endIsHorizontal) {
      const middleY = (start.y + end.y) / 2;
      return [
        { x: start.x, y: middleY },
        { x: end.x, y: middleY }
      ];
    }
    return startIsHorizontal
      ? [{ x: end.x, y: start.y }]
      : [{ x: start.x, y: end.y }];
  }

  function getRoute(flow, options) {
    const routeOptions = options || {};
    const fromBox =
      routeOptions.fromBox || getDepartmentBox(flow.from);
    const toBox =
      routeOptions.toBox || getDepartmentBox(flow.to);
    const inferred = inferSides(fromBox, toBox);
    const route = routeOptions.route || flow.route || {};
    const startSide = route.startSide || inferred.startSide;
    const endSide = route.endSide || inferred.endSide;
    const start = offsetAlongSide(
      getAnchor(fromBox, startSide),
      fromBox,
      startSide,
      route.startOffset
    );
    const end = offsetAlongSide(
      getAnchor(toBox, endSide),
      toBox,
      endSide,
      route.endOffset
    );
    const startVector = getSideVector(startSide);
    const endVector = getSideVector(endSide);
    const spacing = Number.isFinite(route.spacing) ? route.spacing : 14;
    const startGuide = {
      x: start.x + startVector.x * spacing,
      y: start.y + startVector.y * spacing
    };
    const endGuide = {
      x: end.x + endVector.x * spacing,
      y: end.y + endVector.y * spacing
    };
    const points = [];

    addPoint(points, start);
    addPoint(points, startGuide);

    if (route.points && route.points.length) {
      route.points.forEach(function (point) {
        addPoint(points, {
          x: (point.x / 100) * elements.stage.clientWidth,
          y: (point.y / 100) * elements.stage.clientHeight
        });
      });
    } else {
      automaticElbows(startGuide, endGuide, startSide, endSide).forEach(
        function (point) {
          addPoint(points, point);
        }
      );
    }

    addPoint(points, endGuide);
    addPoint(points, end);

    return { points: points, end: end };
  }

  function pointsToPath(points) {
    return points
      .map(function (point, index) {
        return (index === 0 ? "M " : "L ") + point.x + " " + point.y;
      })
      .join(" ");
  }

  function percentagePoint(point) {
    return {
      x: (point.x / 100) * elements.stage.clientWidth,
      y: (point.y / 100) * elements.stage.clientHeight
    };
  }

  function getDirectBranchRoute(flow, startPoint, route) {
    const branchRoute = route || {};
    const resolvedStart = branchRoute.start
      ? percentagePoint(branchRoute.start)
      : startPoint;
    const targetBox = getDepartmentBox(flow.to);
    const startBox = {
      x: resolvedStart.x,
      y: resolvedStart.y,
      width: 0,
      height: 0
    };
    const inferred = inferSides(startBox, targetBox);
    const endSide = branchRoute.endSide || inferred.endSide;
    const end = offsetAlongSide(
      getAnchor(targetBox, endSide),
      targetBox,
      endSide,
      branchRoute.endOffset
    );
    const points = [];

    addPoint(points, resolvedStart);
    (branchRoute.points || []).forEach(function (point) {
      addPoint(points, percentagePoint(point));
    });
    addPoint(points, end);

    return { points: points, end: end };
  }

  function createSvgElement(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);
    Object.keys(attributes || {}).forEach(function (attribute) {
      element.setAttribute(attribute, attributes[attribute]);
    });
    return element;
  }

  function createMarkers(flows) {
    const defs = createSvgElement("defs");
    const originIds = Array.from(
      new Set(
        flows.map(function (flow) {
          return flow.from;
        })
      )
    );

    originIds.forEach(function (originId) {
      const marker = createSvgElement("marker", {
        id: "arrow-" + originId,
        viewBox: "0 0 12 12",
        refX: "10",
        refY: "6",
        markerWidth: "10",
        markerHeight: "10",
        orient: "auto-start-reverse",
        markerUnits: "userSpaceOnUse"
      });
      const tip = createSvgElement("path", {
        d: "M 1 1 L 11 6 L 1 11 z",
        fill: DEPARTMENTS[originId].color
      });
      marker.appendChild(tip);
      defs.appendChild(marker);
    });

    elements.svg.appendChild(defs);
  }

  function getLabelPosition(flow, route) {
    const points = route.points;
    const end = points[points.length - 1];
    const previous = points[points.length - 2] || points[0];
    const dx = end.x - previous.x;
    const dy = end.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    const distanceFromTarget = 70;
    const label = flow.label || {};

    return {
      x:
        end.x -
        (dx / length) * distanceFromTarget +
        (Number(label.offsetX) || 0),
      y:
        end.y -
        (dy / length) * distanceFromTarget +
        (Number(label.offsetY) || 0)
    };
  }

  function createFlowLabel(flow, route, index) {
    const position = getLabelPosition(flow, route);
    const label = document.createElement("div");
    label.className = "flow-label";
    label.style.left = position.x + "px";
    label.style.top = position.y + "px";
    label.style.setProperty("--flow-color", DEPARTMENTS[flow.from].color);
    label.style.animationDelay = Math.min(index * 28, 180) + "ms";

    flow.resources.forEach(function (resourceId) {
      const resource = RESOURCES[resourceId];
      const line = document.createElement("span");
      line.textContent = "• " + (resource.shortLabel || resource.label);
      label.appendChild(line);
    });

    elements.labels.appendChild(label);
  }

  function createFlowGroup(group, groupFlows) {
    const groupElement = document.createElement("div");
    const title = document.createElement("strong");
    const resources = document.createElement("div");
    const resourceIds = groupFlows[0].resources;

    groupElement.className = "flow-group";
    groupElement.style.left = group.position.x + "%";
    groupElement.style.top = group.position.y + "%";
    groupElement.style.setProperty(
      "--flow-color",
      DEPARTMENTS[group.from].color
    );
    title.className = "flow-group__title";
    title.textContent = group.title;
    resources.className = "flow-group__resources";

    resourceIds.forEach(function (resourceId) {
      const item = document.createElement("span");
      item.textContent = RESOURCES[resourceId].label;
      resources.appendChild(item);
    });

    groupElement.appendChild(title);
    groupElement.appendChild(resources);
    elements.labels.appendChild(groupElement);
    return groupElement;
  }

  function appendConnectionPath(flow, route, index, withArrow) {
    const pathData = pointsToPath(route.points);
    const halo = createSvgElement("path", {
      class: "connection-halo",
      d: pathData
    });
    const pathAttributes = {
      class:
        "connection-path" +
        (withArrow ? "" : " connection-path--group-trunk"),
      d: pathData,
      stroke: DEPARTMENTS[flow.from].color
    };

    if (withArrow) {
      pathAttributes["marker-end"] = "url(#arrow-" + flow.from + ")";
    }

    const path = createSvgElement("path", pathAttributes);
    halo.style.animationDelay = Math.min(index * 24, 160) + "ms";
    path.style.animationDelay = Math.min(index * 24, 160) + "ms";
    elements.svg.appendChild(halo);
    elements.svg.appendChild(path);
  }

  function appendGroupJunction(point, color) {
    const halo = createSvgElement("circle", {
      cx: point.x,
      cy: point.y,
      r: "7",
      fill: "#ffffff"
    });
    const junction = createSvgElement("circle", {
      class: "connection-junction",
      cx: point.x,
      cy: point.y,
      r: "4",
      fill: color
    });

    elements.svg.appendChild(halo);
    elements.svg.appendChild(junction);
  }

  function renderConnections() {
    elements.svg.replaceChildren();
    elements.labels.replaceChildren();
    elements.svg.setAttribute(
      "viewBox",
      "0 0 " + elements.stage.clientWidth + " " + elements.stage.clientHeight
    );

    if (!selectedDepartment) {
      return;
    }

    const visibleFlows = getVisibleFlowsFor(selectedDepartment);
    const activeGroups = getActiveFlowGroups(
      selectedDepartment,
      visibleFlows
    );
    const groupedFlowIds = new Set();
    let pathIndex = 0;
    createMarkers(visibleFlows);

    activeGroups.forEach(function (group) {
      const groupFlows = group.flowIds.map(function (flowId) {
        return FLOWS.find(function (flow) {
          return flow.id === flowId;
        });
      });
      const groupElement = createFlowGroup(group, groupFlows);
      const groupBox = getElementBox(groupElement);
      const originBox = getDepartmentBox(group.from);
      const trunkFlow = groupFlows[0];
      const trunkRoute = getRoute(trunkFlow, {
        fromBox: originBox,
        toBox: groupBox,
        route: group.route
      });

      appendConnectionPath(trunkFlow, trunkRoute, pathIndex, false);
      pathIndex += 1;

      if (group.distribution) {
        const junction = percentagePoint(group.distribution.junction);
        const distributorStart = getAnchor(
          groupBox,
          group.distribution.startSide || "bottom"
        );
        appendConnectionPath(
          trunkFlow,
          { points: [distributorStart, junction], end: junction },
          pathIndex,
          false
        );
        pathIndex += 1;

        if (group.distribution.spine) {
          const spineStart = percentagePoint(
            group.distribution.spine.from
          );
          const spineEnd = percentagePoint(
            group.distribution.spine.to
          );
          appendConnectionPath(
            trunkFlow,
            { points: [spineStart, spineEnd], end: spineEnd },
            pathIndex,
            false
          );
          pathIndex += 1;
        }

        groupFlows.forEach(function (flow) {
          groupedFlowIds.add(flow.id);
          const branchRoute = getDirectBranchRoute(
            flow,
            junction,
            (group.branchRoutes && group.branchRoutes[flow.id]) || {}
          );
          appendConnectionPath(flow, branchRoute, pathIndex, true);
          pathIndex += 1;
        });
        appendGroupJunction(
          junction,
          DEPARTMENTS[group.from].color
        );
      } else {
        groupFlows.forEach(function (flow) {
          groupedFlowIds.add(flow.id);
          const branchRoute = getRoute(flow, {
            fromBox: groupBox,
            toBox: getDepartmentBox(flow.to),
            route:
              (group.branchRoutes && group.branchRoutes[flow.id]) ||
              flow.route
          });
          appendConnectionPath(flow, branchRoute, pathIndex, true);
          pathIndex += 1;
        });
      }
    });

    visibleFlows.forEach(function (flow) {
      if (groupedFlowIds.has(flow.id)) {
        return;
      }
      const route = getRoute(flow);
      appendConnectionPath(flow, route, pathIndex, true);
      createFlowLabel(flow, route, pathIndex);
      pathIndex += 1;
    });
  }

  function updateDepartmentStates() {
    const related = selectedDepartment
      ? getRelatedDepartments(selectedDepartment)
      : new Set();

    departmentIds.forEach(function (id) {
      const node = departmentNodes.get(id);
      if (!node) {
        return;
      }
      node.classList.remove("is-selected", "is-related", "is-muted");
      node.setAttribute("aria-pressed", id === selectedDepartment ? "true" : "false");

      if (!selectedDepartment) {
        node.classList.add("is-related");
      } else if (id === selectedDepartment) {
        node.classList.add("is-selected");
      } else if (related.has(id)) {
        node.classList.add("is-related");
      } else {
        node.classList.add("is-muted");
      }
    });
  }

  function createResourceListFromIds(resourceIds) {
    const list = document.createElement("ul");
    resourceIds.forEach(function (resourceId) {
      const item = document.createElement("li");
      item.textContent = RESOURCES[resourceId].label;
      list.appendChild(item);
    });
    return list;
  }

  function createResourceList(flow) {
    return createResourceListFromIds(flow.resources);
  }

  function createRelationCard(flow, mode) {
    const otherId = mode === "incoming" ? flow.from : flow.to;
    const card = document.createElement("article");
    const title = document.createElement("strong");
    card.className = "relation-card";
    card.style.setProperty(
      "--relation-color",
      DEPARTMENTS[flow.from].color
    );
    title.textContent = DEPARTMENTS[otherId].name;
    card.appendChild(title);
    card.appendChild(createResourceList(flow));
    return card;
  }

  function createGroupRelationCard(group, groupFlows) {
    const card = document.createElement("article");
    const title = document.createElement("strong");
    card.className = "relation-card relation-card--grouped";
    card.style.setProperty(
      "--relation-color",
      DEPARTMENTS[group.from].color
    );
    title.textContent = group.title;
    card.appendChild(title);
    card.appendChild(
      createResourceListFromIds(groupFlows[0].resources)
    );
    return card;
  }

  function createInfoSection(titleText, flows, mode, groups) {
    const section = document.createElement("section");
    const title = document.createElement("h3");
    const activeGroups = groups || [];
    const groupedFlowIds = new Set();
    section.className = "info-section";
    title.textContent = titleText;
    section.appendChild(title);

    activeGroups.forEach(function (group) {
      const groupFlows = flows.filter(function (flow) {
        return group.flowIds.includes(flow.id);
      });
      groupFlows.forEach(function (flow) {
        groupedFlowIds.add(flow.id);
      });
      section.appendChild(createGroupRelationCard(group, groupFlows));
    });

    const individualFlows = flows.filter(function (flow) {
      return !groupedFlowIds.has(flow.id);
    });

    if (!individualFlows.length && !activeGroups.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No hay relaciones registradas.";
      section.appendChild(empty);
    } else {
      individualFlows.forEach(function (flow) {
        section.appendChild(createRelationCard(flow, mode));
      });
    }
    return section;
  }

  function renderGeneralInfo() {
    const eyebrow = document.createElement("p");
    const title = document.createElement("h2");
    const intro = document.createElement("p");
    const steps = document.createElement("ol");
    const note = document.createElement("p");
    const instructions = [
      "Elegí un sector directamente en el mapa.",
      "Seguí sus flechas entrantes y salientes.",
      "Consultá aquí el detalle completo de cada recurso."
    ];

    elements.info.className = "";
    eyebrow.className = "info-panel__eyebrow";
    eyebrow.textContent = "Vista general";
    title.textContent = "Cómo explorar el mapa";
    intro.className = "info-panel__intro";
    intro.textContent =
      "La vista inicial funciona como un menú visual: todos los sectores conservan su color y todavía no se muestran conexiones.";
    steps.className = "usage-steps";

    instructions.forEach(function (instruction, index) {
      const item = document.createElement("li");
      const number = document.createElement("b");
      const text = document.createElement("span");
      number.textContent = index + 1;
      text.textContent = instruction;
      item.appendChild(number);
      item.appendChild(text);
      steps.appendChild(item);
    });

    note.className = "panel-note";
    note.textContent =
      "Las relaciones se calculan desde una única definición de flujos. El color identifica al sector que origina cada entrega.";

    elements.info.replaceChildren(eyebrow, title, intro, steps, note);
  }

  function renderSelectedInfo() {
    const department = DEPARTMENTS[selectedDepartment];
    const incoming = FLOWS.filter(function (flow) {
      return flow.to === selectedDepartment;
    });
    const outgoing = FLOWS.filter(function (flow) {
      return flow.from === selectedDepartment;
    });
    const outgoingGroups = getActiveFlowGroups(
      selectedDepartment,
      outgoing
    );
    const visibleFlows = getVisibleFlowsFor(selectedDepartment);
    const sections = [];
    const summary = document.createElement("div");
    const eyebrow = document.createElement("p");
    const title = document.createElement("h2");
    const intro = document.createElement("p");
    const total = document.createElement("p");
    const note = document.createElement("p");

    elements.info.className =
      "has-selection flow-mode-" + flowMode;
    elements.info.style.setProperty("--panel-color", department.color);
    summary.className = "info-summary";
    eyebrow.className = "info-panel__eyebrow";
    eyebrow.textContent = department.external ? "Elemento externo" : "Sector seleccionado";
    title.textContent = department.name;
    intro.className = "info-panel__intro";
    intro.textContent =
      flowMode === "incoming"
        ? "Se muestran únicamente los insumos que recibe este sector."
        : flowMode === "outgoing"
          ? "Se muestran únicamente los resultados que entrega este sector."
          : "Se muestran las relaciones entrantes y salientes vinculadas con este sector.";
    total.className = "connection-total";
    total.textContent =
      visibleFlows.length +
      (visibleFlows.length === 1
        ? " conexión asociada"
        : " conexiones asociadas");
    note.className = "panel-note";
    note.textContent =
      "Podés seleccionar cualquier sector relacionado para continuar recorriendo el sistema.";

    summary.appendChild(eyebrow);
    summary.appendChild(title);
    summary.appendChild(intro);
    summary.appendChild(total);
    summary.appendChild(note);

    if (flowMode !== "outgoing") {
      sections.push(
        createInfoSection("Recibe insumos de", incoming, "incoming")
      );
    }
    if (flowMode !== "incoming") {
      sections.push(createInfoSection(
        "Entrega resultados a",
        outgoing,
        "outgoing",
        outgoingGroups
      ));
    }

    elements.info.replaceChildren(summary, ...sections);
  }

  function renderInfo() {
    if (selectedDepartment) {
      renderSelectedInfo();
    } else {
      renderGeneralInfo();
    }
  }

  function updateTextState() {
    if (selectedDepartment) {
      const department = DEPARTMENTS[selectedDepartment];
      const count = getVisibleFlowsFor(selectedDepartment).length;
      const modeLabel =
        flowMode === "incoming"
          ? "recibidas"
          : flowMode === "outgoing"
            ? "entregadas"
            : "visibles";
      elements.status.textContent =
        department.name +
        " · " +
        count +
        (count === 1
          ? " conexión " + modeLabel.replace(/s$/, "")
          : " conexiones " + modeLabel);
      elements.prompt.classList.add("is-hidden");
    } else {
      elements.status.textContent = "Seleccioná un sector";
      elements.prompt.classList.remove("is-hidden");
    }
  }

  function updateFlowFilterState() {
    elements.flowFilterButtons.forEach(function (button) {
      const isActive = button.dataset.flowMode === flowMode;
      button.disabled = !selectedDepartment;
      button.classList.toggle("is-active", isActive);
      button.setAttribute(
        "aria-pressed",
        isActive ? "true" : "false"
      );
    });
  }

  function setFlowMode(mode) {
    if (!FLOW_MODES.has(mode) || !selectedDepartment) {
      return;
    }
    flowMode = mode;
    updateFlowFilterState();
    updateDepartmentStates();
    updateTextState();
    renderInfo();
    scheduleConnectionRender();
  }

  function scheduleConnectionRender() {
    window.clearTimeout(redrawTimer);
    if (redrawFrame !== null) {
      window.cancelAnimationFrame(redrawFrame);
    }
    redrawFrame = window.requestAnimationFrame(function () {
      redrawFrame = null;
      renderConnections();
    });
    redrawTimer = window.setTimeout(function () {
      redrawTimer = null;
      renderConnections();
    }, 310);
  }

  function selectDepartment(id) {
    if (!DEPARTMENTS[id]) {
      return;
    }
    selectedDepartment = id;
    updateFlowFilterState();
    updateDepartmentStates();
    updateTextState();
    renderInfo();
    scheduleConnectionRender();
  }

  function resetMap() {
    selectedDepartment = null;
    flowMode = "all";
    updateFlowFilterState();
    updateDepartmentStates();
    updateTextState();
    renderInfo();
    scheduleConnectionRender();
  }

  function updateInfoPanelState() {
    const action = isInfoPanelOpen ? "Cerrar" : "Abrir";
    elements.workspace.classList.toggle(
      "is-info-collapsed",
      !isInfoPanelOpen
    );
    elements.infoToggle.setAttribute(
      "aria-expanded",
      isInfoPanelOpen ? "true" : "false"
    );
    elements.infoToggle.setAttribute(
      "aria-label",
      action + " panel informativo"
    );
    elements.infoToggle.title = action + " panel informativo";
    elements.infoToggle.querySelector("span").textContent =
      isInfoPanelOpen ? "»" : "«";
    elements.info.setAttribute(
      "aria-hidden",
      isInfoPanelOpen ? "false" : "true"
    );
    scheduleConnectionRender();
  }

  function toggleInfoPanel() {
    isInfoPanelOpen = !isInfoPanelOpen;
    updateInfoPanelState();
  }

  function renderDataErrors(errors) {
    const box = document.createElement("div");
    const title = document.createElement("strong");
    const list = document.createElement("ul");
    box.className = "data-error";
    title.textContent = "No se pudo iniciar el mapa.";
    errors.forEach(function (message) {
      const item = document.createElement("li");
      item.textContent = message;
      list.appendChild(item);
    });
    box.appendChild(title);
    box.appendChild(list);
    elements.info.replaceChildren(box);
  }

  function mount(targetRoot, slideContext) {
    context = slideContext;
    selectedDepartment = null;
    flowMode = "all";
    isInfoPanelOpen = true;
    redrawTimer = null;
    redrawFrame = null;
    resizeObserver = null;
    departmentNodes = new Map();
    cleanups = [];

    createStructure(targetRoot, slideContext);
    const errors = validateData();
    if (errors.length) {
      renderDataErrors(errors);
      return;
    }

    createDepartments();
    updateFlowFilterState();
    updateDepartmentStates();
    updateTextState();
    renderInfo();
    updateInfoPanelState();
    renderConnections();

    elements.flowFilterButtons.forEach(function (button) {
      listen(button, "click", function () {
        setFlowMode(button.dataset.flowMode);
      });
    });
    listen(elements.reset, "click", resetMap);
    listen(elements.infoToggle, "click", toggleInfoPanel);
    listen(elements.infoPanel, "focus", function () {
      if (!isInfoPanelOpen) {
        isInfoPanelOpen = true;
        updateInfoPanelState();
      }
    });

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(scheduleConnectionRender);
      resizeObserver.observe(elements.stage);
    } else {
      listen(window, "resize", scheduleConnectionRender);
    }
  }

  function unmount() {
    window.clearTimeout(redrawTimer);
    redrawTimer = null;
    if (redrawFrame !== null) {
      window.cancelAnimationFrame(redrawFrame);
      redrawFrame = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    cleanups.forEach(function (cleanup) {
      cleanup();
    });
    cleanups = [];
    departmentNodes.clear();
    departmentNodes = new Map();
    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }
    root = null;
    context = null;
    elements = null;
    selectedDepartment = null;
    flowMode = "all";
    isInfoPanelOpen = true;
  }

  function handleKey(event) {
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft"
    ) {
      return false;
    }
    const target =
      event.target &&
      typeof event.target.closest === "function" &&
      event.target.closest("[data-department-id]");
    if (!target || !root || !root.contains(target)) {
      return false;
    }
    const index = departmentIds.indexOf(target.dataset.departmentId);
    if (index < 0) {
      return false;
    }
    handleDepartmentKeydown(event, index);
    return true;
  }

  function goToStep(number) {
    if (![0, 1, 2].includes(number)) {
      throw new Error("El paso solicitado no existe en Interconexiones.");
    }

    isInfoPanelOpen = true;
    updateInfoPanelState();
    resetMap();

    if (number === 1) {
      selectDepartment("direccion");
    } else if (number === 2) {
      selectDepartment("tecnologia");
    }
  }

  Presentacion.registrarDiapositiva("interconexiones", {
    montar: mount,
    desmontar: unmount,
    cantidadPasos: function () {
      return 2;
    },
    irAPaso: goToStep,
    manejarTecla: handleKey
  });
})();
