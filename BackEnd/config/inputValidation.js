// Regular expression for Mobile validation (10 digits, only number)
const mobileValidation = /^[0-9]{10}$/;
// Regular expression for Mobile validation (6 digits, only number)
const otpValidation = /^[0-9]{6}$/;
// Regular expression for SMS validation (no empty strings, no whitespace-only strings)
const smsRegex = /^[a-zA-Z0-9.,/:;'"(){}[\]#&_-]+(\s*[a-zA-Z0-9.,/:;'"(){}\[\]#&_-]+)*$/
// Regular expression for Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
// Regular expression for Password validation
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/; 

module.exports = {
    mobileValidation,
    smsRegex,
    emailRegex,
    passwordRegex,
    otpValidation
}