# UI / UX — líneas maestras Passtore

Objetivo: sensación **premium**, **minimal**, espacio generoso, sin contornos pesados. Referencias: 1Password, Arc, Linear, Revolut, Notion (modo limpio).

## Marca temporal

- Logo: **“P”** tipográfico hasta asset final.
- Paleta base:
  - Negro / gris muy oscuro para fondos.
  - Acentos en **rojo**, **rojo vino**, **coral oscuro** — derivaciones monocromáticas, no arcoíris.
- Evitar sombras duras; preferir **elevación sutil** y **blur** donde el SO lo permita.

## Principios de layout

- Mucho **aire** entre bloques; jerarquía por tipografía, no por cajas múltiples.
- Listas con separación clara; detalle de credencial legible de un vistazo.
- Estados de sync / offline **visibles pero no alarmistas** (píldora discreta).

## Pantallas previstas

Welcome / Onboarding → Login / Registro → Home (insights + recientes + estado sync) → Vault → Detalle → Crear / editar → Generador avanzado → Seguridad → Dispositivos → Ajustes → Notificaciones.

## Home (objetivo)

- Contraseñas recientes.
- Resumen de seguridad (réplicas, débiles).
- Alertas accionables.
- Estado **online/offline**, último sync, lista corta de dispositivos.

## Accesibilidad

- Contraste AA mínimo sobre fondo oscuro.
- Tamaños táctiles ≥ 44pt donde aplique.

Este documento es vivo; decisiones finas de componentes viven junto al código de tema (`theme/colors`, etc.).
