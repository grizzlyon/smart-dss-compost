class DSSService:
    """
    Engine untuk Decision Support System berdasarkan parameter:
    Temperature, Humidity (MC%), Gas (Ammonia), dan Maturity Score.
    """
    
    @staticmethod
    def generate_recommendation(
        temperature: float, 
        humidity: float, 
        gas: float, 
        maturity_score: float
    ) -> str:
        
        # Aturan 1: Jika sudah matang, tidak perlu penyesuaian lain
        if maturity_score >= 80.0:
            return "Kompos sudah matang dan siap digunakan atau dipanen."
            
        actions = []
        
        # Aturan 2: Suhu (Fase Termofilik biasanya 45°C - 65°C)
        if temperature < 35.0:
            actions.append("Tambahkan bahan hijau (kaya nitrogen) untuk menaikkan suhu")
        elif temperature > 65.0:
            actions.append("Suhu terlalu panas, segera lakukan pembalikan kompos")
            
        # Aturan 3: Kelembapan / MC (Idealnya 40% - 60%)
        if humidity < 40.0:
            actions.append("Tambahkan air karena kompos terlalu kering")
        elif humidity > 60.0:
            actions.append("Tambahkan bahan coklat (serbuk gergaji/daun kering) untuk mengurangi kelembapan")
            
        # Aturan 4: Gas Amonia (Parameter indikasi bau/anaerob)
        # Threshold diambil sebagai contoh (misal: > 2500 mg/kg perlu sirkulasi)
        if gas > 2500.0:
            actions.append("Aduk kompos untuk memberi aerasi dan mengurangi kadar gas amonia")
            
        # Jika tidak ada anomali
        if not actions:
            return "Kondisi kompos optimal. Lanjutkan proses inkubasi tanpa tindakan khusus."
            
        # Gabungkan semua rekomendasi
        recommendation_text = "Rekomendasi DSS: " + " | ".join(actions)
        return recommendation_text