 <script>
    document.getElementById('dark-mode-toggle').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        const inputContainer = document.querySelector('.input-container');
        inputContainer.classList.toggle('dark-mode');
        
        const inputField = document.querySelector('.input-container input');
        inputField.classList.toggle('dark-mode');
        
        const sendButton = document.querySelector('.input-container button');
        sendButton.classList.toggle('dark-mode');
        
        const header = document.querySelector('.header');
        header.classList.toggle('dark-mode');
        
        const messages = document.querySelector('.messages');
        messages.classList.toggle('dark-mode');
        
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.classList.toggle('dark-mode');
        
        const messageContent = document.querySelectorAll('.message-item .message-content');
        messageContent.forEach(item => item.classList.toggle('dark-mode'));
        
        const inputButton = document.querySelector('.input-container button');
        inputButton.classList.toggle('dark-mode');
    });
</script>
<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
    import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
    import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
    import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp, orderBy, deleteDoc, doc, getDocs, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

    document.addEventListener("DOMContentLoaded", async function () {
        const firebaseConfig = {
            apiKey: "AIzaSyAaBpFHuORdj_8gMRYrTbHP4au8s2nN13E",
            authDomain: "dynexadmin.firebaseapp.com",
            projectId: "dynexadmin",
            storageBucket: "dynexadmin.firebasestorage.app",
            messagingSenderId: "52244434742",
            appId: "1:52244434742:web:b122a1c90011acd6836d97",
            measurementId: "G-PJQTC563T7",
            databaseURL: "https://dynexadmin-default-rtdb.europe-west1.firebasedatabase.app",
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const realtimeDb = getDatabase(app);

        let username, password;
        let typingTimeout;

        const swearWords = ["pic", "küfür2", "küfür3"];

        async function fetchBotResponses() {
            const botResponsesCollection = collection(db, "botResponses");
            const botResponsesSnapshot = await getDocs(botResponsesCollection);
            const botResponses = {};

            botResponsesSnapshot.forEach((doc) => {
                botResponses[doc.id] = doc.data().response;
            });

            return botResponses;
        }

        function censorMessage(message) {
            swearWords.forEach((word) => {
                const regex = new RegExp(word, "gi");
                message = message.replace(regex, "*".repeat(word.length));
            });
            return message;
        }

        async function checkCredentials(username, password) {
            try {
                const dbRef = ref(realtimeDb);
                const snapshot = await get(child(dbRef, "users"));

                if (snapshot.exists()) {
                    const users = snapshot.val();
                    for (const userKey in users) {
                        const user = users[userKey];
                        if (user.username === username && user.password === password) {
                            return true;
                        }
                    }
                    console.error("Kullanıcı adı veya şifre hatalı!");
                    return false;
                } else {
                    console.error("Veritabanında kullanıcılar bulunamadı!");
                    return false;
                }
            } catch (error) {
                console.error("Hata oluştu:", error);
                return false;
            }
        }

        const result = await Swal.fire({
            title: '<img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjY0xIcWFN9cAXz6Tr4JGKexxB39GQsdUGlDVJItXfPNxCyJvp-y-mgknKdf3uz77FOfITVYLzVusLzV9ufku6gNG7A492_GS2wORkCw1DUhsO7sepLzi28fjBkKSgkvh4ZUYfjR-Wo_wMoTeEVQukvxysjXGDlhk4b7rNQxascfmdTS7RXjnk5nRCsxSR3/s415/IMG_20250213_203131.png" alt="Logo" style="max-width: 100%; height: 30px; margin-top: 20px; margin-bottom: -7px"> Yönetici',
            html: `
                <input type="text" id="username" class="swal2-input" placeholder="Kullanıcı Adı">
                <input type="password" id="password" class="swal2-input" placeholder="Şifre">
                <div style="display: flex; justify-content: space-between;">
                    <a href="#" style="font-size: 12px; color: #01796f;">Şifremi unuttum</a>
                    <a href="#" style="font-size: 12px; color: #01796f;">Kaydol</a>
                </div>
            `,
            confirmButtonText: 'Giriş Yap',
            showCancelButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            preConfirm: async () => {
                username = document.getElementById('username').value.trim();
                password = document.getElementById('password').value.trim();

                if (!username || !password) {
                    Swal.showValidationMessage('Kullanıcı adı ve şifre zorunludur!');
                    return false;
                }
                const valid = await checkCredentials(username, password);
                if (!valid) {
                    Swal.showValidationMessage('Kullanıcı adı veya şifre hatalı!');
                }
                return valid;
            },
        });

        if (!result) {
            location.reload();
            return;
        }

        signInAnonymously(auth).catch((error) => console.error("Anonim giriş hatası:", error));

        const messagesRef = collection(db, "messages");
        const messageInput = document.querySelector("#message-input");
        const sendButton = document.querySelector("#send-button");
        const messagesContainer = document.querySelector("#messages");
        const stickersContainer = document.querySelector("#stickers-container");

        const loadingElement = document.createElement("div");
        loadingElement.id = "loading";
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Mesajlar yükleniyor...</p>
        `;
        messagesContainer.appendChild(loadingElement);

        async function getUserData(username) {
            const snapshot = await get(ref(realtimeDb, "users"));
            if (snapshot.exists()) {
                const users = snapshot.val();
                for (const userId in users) {
                    if (users[userId].username === username) {
                        return users[userId]; // Kullanıcının avatar ve badge bilgisini döndür
                    }
                }
            }
            return { avatar: "https://example.com/default-avatar.png", badge: "user" }; // Varsayılan avatar ve badge
        }

        async function sendMessage(messageText) {
            if (messageText.length > 0) {
                messageText = censorMessage(messageText);

                // Kullanıcı verilerini çek
                const userData = await getUserData(username);
                const avatarUrl = userData.avatar;

                await addDoc(messagesRef, {
                    user: username,
                    message: messageText,
                    isSticker: false,
                    avatar: avatarUrl, // Avatar url ekle
                    timestamp: serverTimestamp(),
                    seen: false,
                });

                const botResponses = await fetchBotResponses();

                for (const keyword in botResponses) {
                    if (messageText.toLowerCase().includes(keyword)) {
                        displayTypingStatus("Bot");
                        setTimeout(async () => {
                            await addDoc(messagesRef, {
                                user: "Bot",
                                message: botResponses[keyword],
                                isSticker: false,
                                timestamp: serverTimestamp(),
                                seen: false,
                            });
                            removeTypingStatus("Bot");
                        }, 2000);
                        break;
                    }
                }

                messageInput.value = "";
                messageInput.focus();
            }
        }

        async function sendSticker(stickerUrl) {
            await addDoc(messagesRef, {
                user: username,
                message: stickerUrl,
                isSticker: true,
                timestamp: serverTimestamp(),
                seen: false,
            });
            closeStickerPopup();
        }

        sendButton.addEventListener("mousedown", (event) => {
            event.preventDefault();
            sendMessage(messageInput.value.trim());
            messageInput.value = ""; // Mesaj gönderildikten sonra metin kutusunu temizle
            clearTimeout(typingTimeout);
            setDoc(doc(db, "typing", username), {
                user: username,
                typing: false,
            });
        });

        messageInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage(messageInput.value.trim());
                messageInput.value = ""; // Mesaj gönderildikten sonra metin kutusunu temizle
                clearTimeout(typingTimeout);
                setDoc(doc(db, "typing", username), {
                    user: username,
                    typing: false,
                });
            }
        });

        messageInput.addEventListener("input", () => {
            clearTimeout(typingTimeout);
            setDoc(doc(db, "typing", username), {
                user: username,
                typing: true,
            });
            typingTimeout = setTimeout(() => {
                setDoc(doc(db, "typing", username), {
                    user: username,
                    typing: false,
                });
            }, 1000);
        });

        const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

        onSnapshot(messagesQuery, (snapshot) => {
            messagesContainer.innerHTML = "";

            if (loadingElement) {
                loadingElement.remove();
            }

            snapshot.forEach((doc) => {
                const message = doc.data();
                const isUserMessage = message.user === username;
                const messageClass = isUserMessage ? "user-message" : "";

                const timestamp = message.timestamp?.toDate();
                const formattedTime = timestamp
                    ? `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`
                    : "Bilinmeyen zaman";

                let messageContent = message.message;
                if (message.isSticker) {
                    messageContent = `<img src="${message.message}" alt="Sticker" class="sticker-message">`;
                }

                // Avatarı mesajlara ekle
                const userIcon = message.user === "Bot" 
                    ? `<img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgBGhHmwMoRMF6GDBnmlYU3hgRfPZEomyhqPEMTGy16c2qLkF1E5NkltoZPX8_lpi3L4nqNopX_76zUHw65Fe3zmLwB9ZSdAqtFhW67-QcpSIJlNPJPmY6wjXoQb47k8rMwOZqMA0TEWTJQGsFHAdRzz-jqYPsSyJsSJkp2k2We3-RF3AS0fwcMeoP6kSAj/s1563/Sugo%20Display_20250215_021051_0000.png" class="bot-icon"/>`
                    : `<img src="${message.avatar}" class="avatar">`;

                // Görüldü ikonu
                const seenClass = message.seen ? "seen" : ""; 
                const seenIcon = `<span class="material-symbols-outlined seen-icon ${seenClass}" data-id="${doc.id}">done_all</span>`;

                const messageElement = `
                    <div class="message-item ${messageClass}" data-username="${message.user}" data-id="${doc.id}">
                        <div class="user-icon">
                            ${userIcon}
                        </div>
                        <div class="message-content">
                            <div class="user-name">
                                ${message.user}
                                ${message.user === "Yıldız" || message.user === "Bot" || message.user === "Ateş" 
                                    ? '  <span class="material-icons" style="color: #1d9bf0; margin-left: 1px;">verified</span>' 
                                    : ''}
                            </div>
                            ${messageContent}
                            <div class="message-time">${formattedTime} ${seenIcon}</div>
                        </div>
                    </div>`;
                messagesContainer.insertAdjacentHTML("beforeend", messageElement);
            });

            // Mesaj görüldü güncelleme
            updateSeenStatus();
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });

        messagesContainer.addEventListener("click", async (event) => {
            const messageItem = event.target.closest(".message-item");
            const deleteIcon = event.target.closest(".delete-icon");
            if (deleteIcon && messageItem) {
                const messageId = messageItem.dataset.id;
                if (messageId) {
                    await deleteDoc(doc(db, "messages", messageId));
                }
            }

            if (messageItem && !deleteIcon) {
                const clickedUsername = messageItem.dataset.username;
                if (clickedUsername) {
                    messageInput.value = `@${clickedUsername} `;
                    messageInput.focus();
                }
            }
        });

        const stickersRef = collection(db, "stickers");
        onSnapshot(stickersRef, (snapshot) => {
            stickersContainer.innerHTML = "";
            snapshot.forEach((doc) => {
                const sticker = doc.data();
                const stickerImg = document.createElement("img");
                stickerImg.src = sticker.url;
                stickerImg.alt = sticker.name || "Sticker";
                stickerImg.classList.add("sticker");
                stickerImg.addEventListener("mousedown", (event) => {
                    event.preventDefault();
                    sendSticker(sticker.url);
                });
                stickersContainer.appendChild(stickerImg);
            });
        });

        const logoImg = document.getElementById("sticker-icon");
        logoImg.addEventListener("click", (event) => {
            event.preventDefault();
            stickersContainer.style.display = stickersContainer.style.display === "block" ? "none" : "block";
        });

        window.addEventListener("resize", () => {
            const currentHeight = window.innerHeight;
            if (currentHeight < initialHeight) {
                stickersContainer.style.display = "none";
            }
        });

        let initialHeight = window.innerHeight;

        // Mesajların görüldüğünü güncelleme işlevi
        function updateSeenStatus() {
            const messageElements = document.querySelectorAll(".message-item");
            messageElements.forEach(async (messageElement) => {
                const messageId = messageElement.dataset.id;
                const messageData = messageElement.dataset.username;
                const seenIcon = messageElement.querySelector(".seen-icon");

                if (messageData && messageData !== username) {
                    if (!messageElement.classList.contains("seen")) {
                        await updateDoc(doc(db, "messages", messageId), { seen: true });
                        messageElement.classList.add("seen");
                        seenIcon.classList.add("seen");
                    }
                }
            });
        }

        async function displayTypingStatus(user) {
            const typingElement = document.querySelector(`.typing-message[data-username="${user}"]`);
            
            if (!typingElement) {
                const userData = await getUserData(user); // Kullanıcı avatarını çek
                const avatarUrl = userData.avatar; // Avatar URL
                const typingMessage = `
                    <div class="message-item typing-message ${user === username ? 'user-message' : ''}" data-username="${user}">
                        <div class="user-icon">
                            <img src="${avatarUrl}" class="avatar">
                        </div>
                        <div class="message-content">
                            <div class="user-name">${user}</div>
                            <div class="message-time">Yazıyor...</div>
                        </div>
                    </div>`;
                
                document.querySelector("#messages").insertAdjacentHTML("beforeend", typingMessage);
                document.querySelector("#messages").scrollTop = document.querySelector("#messages").scrollHeight;
            }
        }

        function removeTypingStatus(user) {
            const typingElement = document.querySelector(`.typing-message[data-username="${user}"]`);
            if (typingElement) {
                typingElement.remove();
            }
        }

        const typingRef = collection(db, "typing");
        onSnapshot(typingRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                    const typingData = change.doc.data();
                    if (typingData.typing) {
                        displayTypingStatus(typingData.user);
                    } else {
                        removeTypingStatus(typingData.user);
                    }
                }
            });
        });

    });
</script>