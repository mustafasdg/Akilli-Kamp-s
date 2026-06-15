namespace SmartCampus.Domain.Entities
{
    /// <summary>
    /// Bir müsaitlik slotunun, üzerindeki randevu taleplerine göre hesaplanan
    /// anlık durumu. Veritabanına yazılmaz; sorgu anında Appointment tablosundan türetilir.
    /// </summary>
    public enum SlotStatus
    {
        /// <summary>Slot boş; randevu talebine açık.</summary>
        Available = 0,

        /// <summary>Slotta onaylanmış (Approved) bir randevu var ya da slot kapatılmış.</summary>
        Booked = 1,

        /// <summary>Slotta hoca onayı bekleyen (Pending) bir randevu talebi var.</summary>
        Pending = 2,
    }
}
