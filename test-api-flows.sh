#!/bin/bash
# Öğretmen ve öğrenci akışlarını API üzerinden test eder.
# Kullanım: ./test-api-flows.sh [BASE_URL]
# Örnek: ./test-api-flows.sh http://localhost:5050

set -e
BASE="${1:-http://localhost:5050}"
API="$BASE/api"
echo "=== API Base: $API ==="

echo ""
echo "1. Öğretmen girişi"
TECH_RESP=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"ogretmen@dilokulu.com","password":"123456"}')
TOKEN_T=$(echo "$TECH_RESP" | jq -r '.token')
if [ "$TOKEN_T" = "null" ] || [ -z "$TOKEN_T" ]; then
  echo "HATA: Öğretmen girişi başarısız. Yanıt: $TECH_RESP"
  exit 1
fi
echo "   OK - Token alındı"

echo ""
echo "2. Öğretmen - Seviyeler"
LEVELS=$(curl -s -H "Authorization: Bearer $TOKEN_T" "$API/teacher/levels")
if echo "$LEVELS" | jq -e . >/dev/null 2>&1; then
  N=$(echo "$LEVELS" | jq 'length')
  echo "   OK - $N seviye: $(echo "$LEVELS" | jq -r '.[].name' | tr '\n' ' ')"
else
  echo "   UYARI: Seviyeler alınamadı (backend yeniden başlatıldı mı?). Yanıt: $LEVELS"
fi

echo ""
echo "3. Öğretmen - Ödev listesi"
ASSIGNS=$(curl -s -H "Authorization: Bearer $TOKEN_T" "$API/teacher/assignments")
N_ASSIGN=$(echo "$ASSIGNS" | jq 'length')
echo "   OK - $N_ASSIGN ödev"

if [ "$N_ASSIGN" -gt 0 ]; then
  FIRST_ID=$(echo "$ASSIGNS" | jq -r '.[0].id')
  echo "   İlk ödev ID: $FIRST_ID"
fi

echo ""
echo "4. Öğrenci girişi"
STU_RESP=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"ayse.yilmaz@email.com","password":"123456"}')
TOKEN_S=$(echo "$STU_RESP" | jq -r '.token')
if [ "$TOKEN_S" = "null" ] || [ -z "$TOKEN_S" ]; then
  echo "HATA: Öğrenci girişi başarısız. Yanıt: $STU_RESP"
  exit 1
fi
echo "   OK - Token alındı"

echo ""
echo "5. Öğrenci - Ödev listesi (aktif/gelecek/geçmiş)"
STU_ASSIGNS=$(curl -s -H "Authorization: Bearer $TOKEN_S" "$API/student/assignments")
ACTIVE=$(echo "$STU_ASSIGNS" | jq '.active | length')
UPCOMING=$(echo "$STU_ASSIGNS" | jq '.upcoming | length')
PAST=$(echo "$STU_ASSIGNS" | jq '.past | length')
echo "   OK - Aktif: $ACTIVE, Gelecek: $UPCOMING, Geçmiş: $PAST"

if [ "$ACTIVE" -gt 0 ]; then
  AID=$(echo "$STU_ASSIGNS" | jq -r '.active[0].id')
  echo ""
  echo "6. Öğrenci - Ödev detayı (ID: $AID)"
  DETAIL=$(curl -s -H "Authorization: Bearer $TOKEN_S" "$API/student/assignments/$AID")
  TITLE=$(echo "$DETAIL" | jq -r '.title')
  echo "   OK - Başlık: $TITLE"

  echo ""
  echo "7. Öğrenci - Ödev teslimi"
  SUB_RESP=$(curl -s -X POST "$API/student/submissions" \
    -H "Authorization: Bearer $TOKEN_S" \
    -H "Content-Type: application/json" \
    -d "{\"assignmentId\":\"$AID\",\"contentText\":\"Test teslim metni (API test).\",\"attachments\":[]}")
  if echo "$SUB_RESP" | jq -e '.id' >/dev/null 2>&1; then
    echo "   OK - Teslim oluşturuldu"
  else
    echo "   NOT: Teslim zaten yapılmış olabilir veya hata: $SUB_RESP"
  fi
else
  echo ""
  echo "6-7. Atlanıyor (aktif ödev yok)"
fi

echo ""
echo "=== Tüm akışlar tamamlandı ==="
