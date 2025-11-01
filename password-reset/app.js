<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
    import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
    import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

    // Firebase yapılandırması
    const firebaseConfig = {
        apiKey: "APP_APIKEY",
        authDomain: "APP_AUTH_DOMAIN",
        databaseURL: "APP_DATABASE_URL",
        projectId: "APP_PROJECT_ID",
        storageBucket: "APP_STORAGE_BUCKET",
        messagingSenderId: "APP_MESSAGING_SENDER_ID",
        appId: "APP_APP_ID",
    };

    // Firebase'i başlat
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);

    async function sifreSifirla() {
        const email = document.getElementById("email").value;
        const mesaj = document.getElementById("mesaj");

        if (!email) {
            mesaj.innerText = "Lütfen bir e-posta adresi girin!";
            mesaj.style.color = "red";
            return;
        }

        // Google reCAPTCHA doğrulaması
        const recaptchaResponse = grecaptcha.getResponse();
        if (recaptchaResponse.length === 0) {
            mesaj.innerText = "Lütfen reCAPTCHA doğrulamasını tamamlayın!";
            mesaj.style.color = "red";
            return;
        }

        // Firebase Realtime Database içinde "users" -> "email" alanında kontrol et
        const usersRef = ref(database, "users");
        get(usersRef).then((snapshot) => {
            if (snapshot.exists()) {
                let kullaniciVarMi = false;

                snapshot.forEach((childSnapshot) => {
                    const kullaniciVerisi = childSnapshot.val();
                    if (kullaniciVerisi.email === email) {
                        kullaniciVarMi = true;
                    }
                });

                if (kullaniciVarMi) {
                    // Kullanıcı kayıtlıysa şifre sıfırlama e-postası gönder
                    sendPasswordResetEmail(auth, email)
                        .then(() => {
                            mesaj.innerText = "Şifre sıfırlama e-postası gönderildi!";
                            mesaj.style.color = "green";
                        })
                        .catch((error) => {
                            mesaj.innerText = "Hata: " + error.message;
                            mesaj.style.color = "red";
                        });
                } else {
                    mesaj.innerText = "Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.";
                    mesaj.style.color = "red";
                }
            } else {
                mesaj.innerText = "Veritabanında kayıtlı kullanıcı yok.";
                mesaj.style.color = "red";
            }
        }).catch((error) => {
            mesaj.innerText = "Veritabanı hatası: " + error.message;
            mesaj.style.color = "red";
        });
    }

    // Butona tıklanınca şifre sıfırlama işlemi başlat
    document.getElementById("sifreSifirlaBtn").addEventListener("click", sifreSifirla);
</script>
  
