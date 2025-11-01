 <script>
    function selectAvatar(url) {
        document.getElementById('avatar').value = url;
    }
</script>
 <script>
    // Kayıt Ol butonuna tıklama olayını dinle
    document.getElementById('register-button').onclick = function() {
      var response = grecaptcha.getResponse();

      // Eğer reCAPTCHA doğrulaması yapılmamışsa
      if (response.length == 0) {
        alert("Lütfen robot olmadığınızı doğrulayın.");
      } else {
        alert("Doğrulama başarılı! Kayıt işlemi yapılabilir.");
        // Kayıt işlemi yapılabilir
        // Burada form verilerini gönderebilir ya da başka işlemler yapabilirsin
      }
    };
  </script>
<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
    import { getDatabase, ref, set, push, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

    // Firebase yapılandırması
    const firebaseConfig = {
        apiKey: "AIzaSyAaBpFHuORdj_8gMRYrTbHP4au8s2nN13E",
        authDomain: "dynexadmin.firebaseapp.com",
        projectId: "dynexadmin",
        storageBucket: "dynexadmin.appspot.com",
        messagingSenderId: "52244434742",
        appId: "1:52244434742:web:b122a1c90011acd6836d97",
        databaseURL: "https://dynexadmin-default-rtdb.europe-west1.firebasedatabase.app",
    };

    // Firebase başlatma
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const auth = getAuth(app);

    // Kayıt butonuna tıklama olayı
    document.getElementById("register-button").addEventListener("click", function() {
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        let avatar = document.getElementById("avatar").value.trim();

        if (!username || !email || !password) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }

        if (!avatar) {
            avatar = "http://dynexplorer.com.tr/uploads/Adsız tasarım_20250315_014605_0000_1741992393.png"; // Varsayılan avatar
        }

        const usersRef = ref(db, "users");
        const usernameQuery = query(usersRef, orderByChild("username"), equalTo(username));
        const emailQuery = query(usersRef, orderByChild("email"), equalTo(email));

        // Kullanıcı adı veya e-posta olup olmadığını kontrol et
        Promise.all([get(usernameQuery), get(emailQuery)]).then((snapshots) => {
            const usernameSnapshot = snapshots[0];
            const emailSnapshot = snapshots[1];

            if (usernameSnapshot.exists()) {
                alert("Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı seçin.");
            } else if (emailSnapshot.exists()) {
                alert("Bu e-posta adresi zaten alınmış. Lütfen başka bir e-posta adresi kullanın.");
            } else {
                // Yeni kullanıcıyı Firebase Authentication ile kaydet
                createUserWithEmailAndPassword(auth, email, password)
                  .then((userCredential) => {
                      const newUserRef = push(usersRef);
                      const userId = userCredential.user.uid;

                      // Firebase Authentication'dan gelen şifreyi veritabanına kaydet
                      set(newUserRef, {
                          username: username,
                          email: email,
                          avatar: avatar,
                          password: password, // Şifreyi kaydediyoruz ama unutma, güvenlik riski oluşturur
                          badge: "user",
                          createdAt: new Date().toISOString()
                      }).then(() => {
                          console.log("Kayıt başarıyla eklendi!");
                          alert("Kayıt başarıyla tamamlandı!");
                          window.location.href = "login.html";
                      }).catch((error) => {
                          console.error("Kayıt sırasında hata oluştu:", error);
                          alert("Kayıt sırasında bir hata oluştu.");
                      });
                  })
                  .catch((error) => {
                      console.error("Kayıt sırasında hata oluştu:", error);
                      alert("Kayıt sırasında bir hata oluştu.");
                  });
            }
        }).catch((error) => {
            console.error("Kullanıcı adı/e-posta kontrolü sırasında hata oluştu:", error);
            alert("Kullanıcı adı/e-posta kontrolü sırasında bir hata oluştu.");
        });
    });
</script>