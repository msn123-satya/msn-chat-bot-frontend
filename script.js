document.addEventListener("DOMContentLoaded", () => {
      let chatbox = document.getElementById("chatbox");
      let isListening = false;
      let recognition = null;
      let finalTranscript = '';
      let interimTranscript = '';


      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
          isListening = true;
          const inputField = document.getElementById('userInput');
          finalTranscript = inputField.value.trim() === '' ? '' : inputField.value;
          interimTranscript = '';
          updateVoiceButton();
        };

      recognition.onresult = function(event) {
      interimTranscript = '';
  
      // Process all new results
      for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
            } else {
        interimTranscript += transcript;
    }
  }
   const inputField = document.getElementById('userInput');
   inputField.value = finalTranscript + interimTranscript;
  
  // Trigger height adjustment
  inputField.dispatchEvent(new Event('input'));
};


        recognition.onend = function() {
          isListening = false;
          updateVoiceButton();
        };

        recognition.onerror = function(event) {
          isListening = false;
          updateVoiceButton();
          console.error('Speech recognition error:', event.error);
        };
      }

      function updateVoiceButton() {
        const voiceBtn = document.getElementById('voiceBtn');
        const micIcon = voiceBtn.querySelector('.mic-icon');
        const checkIcon = voiceBtn.querySelector('.check-icon');
        
        if (isListening) {
          voiceBtn.classList.add('listening');
          micIcon.style.display = 'none';
          checkIcon.style.display = 'block';
          voiceBtn.title = 'Click to stop recording';
        } else {
          voiceBtn.classList.remove('listening');
          micIcon.style.display = 'block';
          checkIcon.style.display = 'none';
          voiceBtn.title = 'Click to start voice input';
        }
      }

    window.toggleVoiceRecording = function () {
  const micBtn = document.getElementById("voiceBtn");
  const micIcon = micBtn.querySelector(".mic-icon");
  const stopIcon = micBtn.querySelector(".stop-icon");

  if (!recognition) {
    alert('Speech recognition is not supported in your browser.');
    return;
  }

  try {
    if (isListening) {
      recognition.stop();
      micBtn.classList.remove("recording");
      micIcon.style.display = "inline";
      stopIcon.style.display = "none";
    } else {
      finalTranscript = '';
      recognition.start();
      micBtn.classList.add("recording");
      micIcon.style.display = "none";
      stopIcon.style.display = "inline";
    }
  } catch (err) {
    console.error("Recognition error:", err);
    isListening = false;
    micBtn.classList.remove("recording");
    micIcon.style.display = "inline";
    stopIcon.style.display = "none";
  }
};


      function addCopyButtons() {
        const preElements = chatbox.querySelectorAll('pre:not([data-copy-added])');
        preElements.forEach(pre => {
          pre.setAttribute('data-copy-added', 'true');
          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-btn';
          copyBtn.innerHTML = `
            <svg class="copy-icon" viewBox="0 0 24 24">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>   Copy`;
          
          copyBtn.onclick = function() {
            const code = pre.querySelector('code') || pre;
            navigator.clipboard.writeText(code.textContent).then(() => {
              copyBtn.innerHTML = `
                <svg class="copy-icon" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>   Copied!`;
              copyBtn.classList.add('copied');
              
              setTimeout(() => {
                copyBtn.innerHTML = `
                  <svg class="copy-icon" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>   Copy`;
                copyBtn.classList.remove('copied');
              }, 2000);
            }).catch(err => {
              console.error('Failed to copy: ', err);
            });
          };
          
          pre.style.position = 'relative';
          pre.appendChild(copyBtn);
        });
      }

      async function sendMessage() {
        let userMessage = document.getElementById("userInput").value.trim();
        if (!userMessage) {
          alert("Please enter your query.");
          return;
        }

        // Add user message
        let userBubble = document.createElement("div");
        userBubble.classList.add("message", "user");
        userBubble.innerText = userMessage;
        chatbox.appendChild(userBubble);
        document.getElementById("userInput").value = "";
        document.getElementById("userInput").style.height = "auto"; // ✅ Fix: Reset textarea height

        chatbox.scrollTop = chatbox.scrollHeight;

        try {
          let response = await fetch("http://127.0.0.1:8000/chat/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: userMessage })
          });

          if (response.ok) {
            let data = await response.json();
            let botBubble = document.createElement("div");
            botBubble.classList.add("message", "bot");

            // Convert Markdown to HTML
            const html = marked.parse(data.reply || '', { gfm: true, breaks: true });
            botBubble.innerHTML = `<div class="bot-reply">${html}</div>`;


            // Highlight code inside the response
            chatbox.appendChild(botBubble);
            hljs.highlightAll();
            
            // Add copy buttons to new code blocks
            addCopyButtons();
          } else {
            let errorBubble = document.createElement("div");
            errorBubble.classList.add("message", "bot");
            errorBubble.innerText = "Error: " + response.status;
            chatbox.appendChild(errorBubble);
          }
        } catch (error) {
          let errorBubble = document.createElement("div");
          errorBubble.classList.add("message", "bot");
          errorBubble.innerText = "Server not responding.";
          chatbox.appendChild(errorBubble);
        }

        chatbox.scrollTop = chatbox.scrollHeight;
      }

      window.sendMessage = sendMessage;
      // Auto-grow textarea height based on content
      const userInput = document.getElementById("userInput");
      userInput.addEventListener('input', function () {
        if (this.value.trim() === '') {
          finalTranscript = '';  // <<< Fix here
      }
      });

      userInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = (this.scrollHeight) + "px";
    });


      document.getElementById("userInput").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          sendMessage();
        }
      });
    });