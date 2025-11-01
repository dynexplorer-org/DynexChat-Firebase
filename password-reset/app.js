<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
    import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
    import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

    // Firebase yapılandırması
    const firebaseConfig = {
        apiKey: "AIzaSyAaBpFHuORdj_8gMRYrTbHP4au8s2nN13E",
        authDomain: "dynexadmin.firebaseapp.com",
        databaseURL: "https://dynexadmin-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "dynexadmin",
        storageBucket: "dynexadmin.appspot.com",
        messagingSenderId: "52244434742",
        appId: "1:52244434742:web:b122a1c90011acd6836d97",
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
  