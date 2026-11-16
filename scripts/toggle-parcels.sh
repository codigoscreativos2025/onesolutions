#!/bin/sh
# toggle-parcels.sh
# Permite activar o desactivar la API de parcelas al instante sin reiniciar el contenedor.
# Uso:
#   ./toggle-parcels.sh off   -> Desactiva la API de parcelas
#   ./toggle-parcels.sh on    -> Reactiva la API de parcelas
#   ./toggle-parcels.sh       -> Muestra el estado actual

FLAG_FILE="/tmp/parcels_disabled"
ALT_FLAG="/app/parcels_disabled"

case "$1" in
  off|disable|desactivar)
    touch "$FLAG_FILE"
    touch "$ALT_FLAG" 2>/dev/null || true
    echo "========================================="
    echo "  PARCELAS DESACTIVADAS"
    echo "  El mapa se muestra normalmente"
    echo "  pero no se consultará ni cargará la capa"
    echo "  de parcelas."
    echo "========================================="
    ;;
  on|enable|activar)
    rm -f "$FLAG_FILE" "$ALT_FLAG" /app/data/parcels_disabled /app/uploads/parcels_disabled 2>/dev/null || true
    echo "========================================="
    echo "  PARCELAS ACTIVADAS"
    echo "  La API de parcelas vuelve a estar activa."
    echo "========================================="
    ;;
  status|estado|*)
    if [ -f "$FLAG_FILE" ] || [ -f "$ALT_FLAG" ]; then
      echo "Estado actual: PARCELAS DESACTIVADAS"
    else
      echo "Estado actual: PARCELAS ACTIVADAS"
    fi
    echo ""
    echo "Para cambiar el estado:"
    echo "  Desactivar:  sh /app/scripts/toggle-parcels.sh off"
    echo "  Activar:     sh /app/scripts/toggle-parcels.sh on"
    ;;
esac
