package de.uulm.automotiveuulmapp.geofencing

import android.location.Location
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.SphericalUtil
import de.uulm.automotive.cds.entities.LocationDataSerializable

class LocationDataFencer(private val currentLocationFetcher: CurrentLocationFetcher) {

    fun shouldAllow(locationData: LocationDataSerializable?): Boolean {
        if (locationData == null)
            return true

        return currentPositionFencing(locationData) || storedLocationsFencing(locationData)
    }

    /**
     * Checks if the current Position is in the radius of the location data
     */
    fun currentPositionFencing(locationData: LocationDataSerializable): Boolean {
        val currentPosition = currentLocationFetcher.getCurrentLocation()
        return currentPosition?.let {
            calculateDistance(
                it.latitude,
                it.longitude,
                locationData.lat,
                locationData.lng
            ) <= locationData.radius
        } ?: false
    }

    /**
     * Checks if the Location matches a stored location
     */
    fun storedLocationsFencing(locationData: LocationDataSerializable): Boolean {
        // Todo
        return false
    }

    private fun calculateDistance(
        firstLat: Double,
        firstLng: Double,
        secondLat: Double,
        secondLng: Double
    ): Double {
        return SphericalUtil.computeDistanceBetween(LatLng(firstLat, firstLng), LatLng(secondLat, secondLng)) / 1000.0
    }

}